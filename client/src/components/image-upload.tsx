import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Image as ImageIcon } from "lucide-react";


interface ImageUploadProps {
  garmentCode: string;
  onImageUploaded?: (imageUrl: string) => void;
}

export default function ImageUpload({ garmentCode, onImageUploaded }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/garments/${garmentCode}/image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it automatically
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error subiendo imagen');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Imagen subida exitosamente",
        description: "La imagen de la prenda ha sido actualizada.",
      });
      
      // Invalidate garment query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/garments', garmentCode] });
      
      if (onImageUploaded && data.imageUrl) {
        onImageUploaded(data.imageUrl);
      }
      
      setSelectedFile(null);
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast({
        title: "Error subiendo imagen",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor seleccione un archivo de imagen.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no puede superar los 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${garmentCode}`}
          data-testid="input-image-file"
        />
        
        <label 
          htmlFor={`image-upload-${garmentCode}`} 
          className="cursor-pointer block"
        >
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {selectedFile ? selectedFile.name : "Haga clic para seleccionar una imagen"}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF hasta 5MB
          </p>
        </label>
      </div>

      {selectedFile && (
        <Button 
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full"
          data-testid="button-upload-image"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadMutation.isPending ? "Subiendo..." : "Subir Imagen"}
        </Button>
      )}
    </div>
  );
}