import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadStats {
  total: number;
  successful: number;
  errors: number;
  warnings: number;
}

export default function ExcelUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/garments/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadStats(data.stats);
      toast({
        title: "Archivo procesado exitosamente",
        description: `${data.stats.successful} registros cargados correctamente.`,
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Error al procesar archivo",
        description: "Hubo un problema al procesar el archivo Excel.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Formato de archivo inválido",
        description: "Por favor seleccione un archivo Excel (.xlsx o .xls).",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(0);
    setUploadStats(null);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(file, {
      onSettled: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const requiredColumns = [
    'CÓDIGO', 'ÁREA', 'DAMA / CAB', 'PRENDA',
    'MODELO', 'TELA', 'COLOR', 'FICHA DE BORDADO'
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary mb-4">Cargar Datos desde Excel</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Importe los datos de prendas desde un archivo Excel con las columnas requeridas.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-colors cursor-pointer ${
              isDragging 
                ? 'border-primary bg-blue-50' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-area"
          >
            <CloudUpload className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-xl font-medium text-secondary mb-2">Arrastre su archivo Excel aquí</p>
            <p className="text-gray-500 mb-4">o haga clic para seleccionar</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInputChange}
              data-testid="input-file-excel"
            />
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Seleccionar Archivo
            </Button>
          </div>

          {/* Required Columns Information */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center">
              <CheckCircle className="text-primary mr-2" />
              Columnas Requeridas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {requiredColumns.map((column, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="text-success mr-2 h-4 w-4" />
                  {column}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {(uploadMutation.isPending || uploadProgress > 0) && (
            <div className="mb-6" data-testid="upload-progress">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-secondary">
                  {uploadMutation.isPending ? 'Procesando archivo...' : 'Completado'}
                </span>
                <span className="text-sm text-secondary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Results */}
          {uploadStats && (
            <div className="grid md:grid-cols-3 gap-6" data-testid="upload-results">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="mx-auto text-success text-2xl mb-2" />
                <div className="text-2xl font-bold text-success" data-testid="stat-successful">
                  {uploadStats.successful}
                </div>
                <div className="text-sm text-gray-600">Registros Cargados</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <AlertTriangle className="mx-auto text-warning text-2xl mb-2" />
                <div className="text-2xl font-bold text-warning" data-testid="stat-warnings">
                  {uploadStats.warnings}
                </div>
                <div className="text-sm text-gray-600">Advertencias</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <XCircle className="mx-auto text-error text-2xl mb-2" />
                <div className="text-2xl font-bold text-error" data-testid="stat-errors">
                  {uploadStats.errors}
                </div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
