import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGarmentSchema, bulkInsertGarmentSchema } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import path from "path";
import fs from "fs";

const upload = multer({ storage: multer.memoryStorage() });

// Configure multer for image uploads
const imageUpload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'garment-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get garment by code
  app.get("/api/garments/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const garment = await storage.getGarmentByCode(code);
      
      if (!garment) {
        return res.status(404).json({ 
          message: "Prenda no encontrada",
          error: "GARMENT_NOT_FOUND" 
        });
      }
      
      res.json(garment);
    } catch (error) {
      console.error("Error fetching garment:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR" 
      });
    }
  });

  // Get all garments
  app.get("/api/garments", async (req, res) => {
    try {
      const garments = await storage.getAllGarments();
      res.json(garments);
    } catch (error) {
      console.error("Error fetching garments:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR" 
      });
    }
  });

  // Upload Excel file and process garments
  app.post("/api/garments/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: "No se proporcionó archivo",
          error: "NO_FILE" 
        });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        return res.status(400).json({ 
          message: "El archivo Excel está vacío",
          error: "EMPTY_FILE" 
        });
      }

      // Get headers and data rows
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      console.log("Headers found:", headers);
      console.log("First row of data:", dataRows[0]);

      if (dataRows.length === 0) {
        return res.status(400).json({ 
          message: "El archivo Excel no tiene datos",
          error: "NO_DATA" 
        });
      }

      // Transform Excel data to match our schema
      const garments = [];
      const errors = [];
      const seenCodes = new Set<string>();
      
      // Find column indices
      const getColumnIndex = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const index = headers.findIndex(h => h && h.toString().toLowerCase().includes(name.toLowerCase()));
          if (index !== -1) return index;
        }
        return -1;
      };

      const codigoIndex = getColumnIndex(['código', 'codigo']);
      const areaIndex = getColumnIndex(['área', 'area']);
      const damaCabIndex = getColumnIndex(['dama', 'cab']);
      const prendaIndex = getColumnIndex(['prenda']);
      const modeloIndex = getColumnIndex(['modelo']);
      const telaIndex = getColumnIndex(['tela']);
      const colorIndex = getColumnIndex(['color']);
      const fichaIndex = getColumnIndex(['ficha', 'bordado']);

      console.log("Column indices:", {
        codigo: codigoIndex,
        area: areaIndex,
        damaCab: damaCabIndex,
        prenda: prendaIndex,
        modelo: modeloIndex,
        tela: telaIndex,
        color: colorIndex,
        ficha: fichaIndex
      });

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        console.log(`Starting to process row ${i + 2}:`, row);
        
        try {
          const garment = {
            codigo: (row[codigoIndex] || '').toString().trim(),
            area: (row[areaIndex] || '').toString().trim(),
            dama_cab: (row[damaCabIndex] || '').toString().trim(),
            prenda: (row[prendaIndex] || '').toString().trim(),
            modelo: (row[modeloIndex] || '').toString().trim(),
            tela: (row[telaIndex] || '').toString().trim(),
            color: (row[colorIndex] || '').toString().trim(),
            ficha_bordado: (row[fichaIndex] || '').toString().trim()
          };

          console.log(`Row ${i + 2} data created successfully:`, garment);

          // Skip empty rows
          console.log(`Checking codigo for row ${i + 2}: "${garment.codigo}" (type: ${typeof garment.codigo}, length: ${garment.codigo?.length || 0})`);
          if (!garment.codigo) {
            errors.push({
              row: i + 2,
              error: 'Código vacío - fila omitida'
            });
            console.log(`Skipping row ${i + 2}: empty codigo`);
            continue;
          }

          // Check for duplicate codes in the Excel file
          if (seenCodes.has(garment.codigo)) {
            console.log(`Duplicate code found: ${garment.codigo} in row ${i + 2}`);
            errors.push({
              row: i + 2,
              error: `Código duplicado en el archivo: ${garment.codigo}`
            });
            continue;
          }
          seenCodes.add(garment.codigo);
          console.log(`Code ${garment.codigo} added to seen codes, continuing to validation...`);

          console.log(`About to validate row ${i + 2}:`, garment);
          // Validate the garment data
          const validatedGarment = insertGarmentSchema.parse(garment);
          console.log(`Validation successful for row ${i + 2}`);
          garments.push(validatedGarment);
        } catch (validationError) {
          console.log(`Validation error for row ${i + 2}:`, validationError);
          errors.push({
            row: i + 2, // Excel rows start at 1, plus header
            error: validationError instanceof z.ZodError 
              ? validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
              : 'Error de validación desconocido'
          });
        }
      }

      console.log(`Processed ${garments.length} valid garments, ${errors.length} errors`);
      console.log("Sample garments to insert:", garments.slice(0, 3));
      console.log("All errors:", errors);

      // Clear existing garments and insert new ones
      await storage.deleteAllGarments();
      
      let successful = 0;
      if (garments.length > 0) {
        try {
          // Filter out any garments with empty codes as a final check
          const validGarments = garments.filter(g => g.codigo && g.codigo.trim() !== '');
          console.log(`Inserting ${validGarments.length} garments after final validation`);
          
          if (validGarments.length === 0) {
            return res.status(400).json({
              message: "No se encontraron códigos válidos en el archivo",
              error: "NO_VALID_CODES",
              processed: garments.length,
              errors: errors.length
            });
          }
          
          const created = await storage.createGarments(validGarments);
          successful = created.length;
        } catch (dbError: any) {
          console.error("Database error during bulk insert:", dbError);
          return res.status(500).json({
            message: "Error al insertar datos en la base de datos",
            error: "DATABASE_INSERT_ERROR",
            details: dbError.message
          });
        }
      }

      res.json({
        message: "Archivo procesado exitosamente",
        stats: {
          total: jsonData.length,
          successful,
          errors: errors.length,
          warnings: 0
        },
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ 
        message: "Error procesando el archivo Excel",
        error: "PROCESSING_ERROR" 
      });
    }
  });

  // Create single garment
  app.post("/api/garments", async (req, res) => {
    try {
      const garmentData = insertGarmentSchema.parse(req.body);
      const garment = await storage.createGarment(garmentData);
      res.status(201).json(garment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: error.errors 
        });
      }
      console.error("Error creating garment:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR" 
      });
    }
  });

  // Upload image for garment
  app.post("/api/garments/:code/image", imageUpload.single('image'), async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ 
          message: "No se proporcionó imagen",
          error: "NO_IMAGE" 
        });
      }

      // Update garment with image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      const updatedGarment = await storage.updateGarmentImage(code, imageUrl);
      
      if (!updatedGarment) {
        // Delete uploaded file if garment not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          message: "Prenda no encontrada",
          error: "GARMENT_NOT_FOUND" 
        });
      }
      
      res.json({
        message: "Imagen subida exitosamente",
        garment: updatedGarment,
        imageUrl
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        message: "Error subiendo imagen",
        error: "UPLOAD_ERROR" 
      });
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
