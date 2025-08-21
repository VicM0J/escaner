import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Edit, Calendar, Image as ImageIcon } from "lucide-react";
import ImageUpload from "./image-upload";
import { useState } from "react";
import type { Garment } from "@shared/schema";

interface GarmentModalProps {
  garment: Garment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GarmentModal({ garment, isOpen, onClose }: GarmentModalProps) {
  if (!garment) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "No disponible";
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getColorIndicator = (color: string) => {
    const colorMap: Record<string, string> = {
      'azul': 'bg-blue-500',
      'azul marino': 'bg-blue-800',
      'rojo': 'bg-red-500',
      'verde': 'bg-green-500',
      'amarillo': 'bg-yellow-500',
      'negro': 'bg-black',
      'blanco': 'bg-white border-2 border-gray-300',
      'gris': 'bg-gray-500',
      'rosa': 'bg-pink-500',
      'morado': 'bg-purple-500',
      'naranja': 'bg-orange-500',
    };

    const normalizedColor = color.toLowerCase();
    return colorMap[normalizedColor] || 'bg-gray-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" data-testid="modal-garment-info">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">
            Información de la Prenda - {garment.codigo}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="image">Imagen</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
          {/* Garment Code Header */}
          <div className="bg-primary rounded-lg text-white p-4 text-center">
            <div className="text-sm opacity-90">Código de la Prenda</div>
            <div className="text-2xl font-mono font-bold" data-testid="text-garment-code">
              {garment.codigo}
            </div>
          </div>

          {/* Garment Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Área
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-area">
                  {garment.area}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Categoría
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-category">
                  {garment.dama_cab}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Prenda
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-type">
                  {garment.prenda}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Modelo
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-model">
                  {garment.modelo}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Tela
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-fabric">
                  {garment.tela}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Color
                </div>
                <div className="flex items-center">
                  <div 
                    className={`w-6 h-6 rounded-full mr-3 ${getColorIndicator(garment.color)}`}
                    data-testid="color-indicator"
                  ></div>
                  <div className="text-lg font-semibold text-secondary" data-testid="text-garment-color">
                    {garment.color}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Ficha de Bordado
                </div>
                <div className="text-lg font-semibold text-secondary" data-testid="text-garment-embroidery">
                  {garment.ficha_bordado}
                </div>
              </div>

              {/* Timestamp */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-success uppercase tracking-wide mb-1 flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Última Actualización
                </div>
                <div className="text-sm text-gray-600" data-testid="text-garment-updated">
                  {formatDate(garment.updatedAt)}
                </div>
              </div>
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                data-testid="button-print-label"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Etiqueta
              </Button>
              <Button 
                variant="outline"
                className="flex-1 font-semibold"
                data-testid="button-edit-info"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Información
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            {/* Image Display */}
            <div className="text-center">
              {garment.imagen_url ? (
                <div className="space-y-4">
                  <img 
                    src={garment.imagen_url} 
                    alt={`Imagen de ${garment.prenda} - ${garment.codigo}`}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                    data-testid="img-garment-photo"
                  />
                  <p className="text-sm text-gray-600">
                    Imagen actual de la prenda
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No hay imagen disponible</p>
                  <p className="text-sm text-gray-500">
                    Suba una imagen de referencia para esta prenda
                  </p>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Subir nueva imagen</h3>
              <ImageUpload 
                garmentCode={garment.codigo} 
                onImageUploaded={() => {
                  // Refresh data will be handled by the mutation
                }} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}