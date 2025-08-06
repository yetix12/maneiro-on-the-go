
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, MapPin, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GalleryImage {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen_url: string;
  categoria: string;
}

const ImageGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('galeria_maneiro')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching gallery images:', error);
          setError('Error al cargar las imágenes');
        } else {
          setImages(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Error inesperado al cargar las imágenes');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  const categories = [...new Set(images.map(img => img.categoria))];
  const filteredImages = selectedCategory 
    ? images.filter(img => img.categoria === selectedCategory)
    : images;

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Camera size={24} />
          Galería de Maneiro
        </h2>
        <p className="text-gray-600">Descubre los lugares más importantes de nuestro municipio</p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando imágenes...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todas
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Grid de imágenes */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(image)}>
              <div className="relative">
                <img 
                  src={image.imagen_url} 
                  alt={image.titulo}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <Badge className="absolute top-2 right-2 bg-blue-600">
                  {image.categoria}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  {image.titulo}
                </h3>
                <p className="text-gray-600 text-sm">{image.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             onClick={() => setSelectedImage(null)}>
           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage.imagen_url} 
              alt={selectedImage.titulo}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedImage.titulo}</h2>
                <Badge>{selectedImage.categoria}</Badge>
              </div>
              <p className="text-gray-600">{selectedImage.descripcion}</p>
              <Button 
                className="mt-4 w-full" 
                onClick={() => setSelectedImage(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredImages.length === 0 && (
        <Card className="p-8 text-center">
          <Image size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No hay imágenes disponibles</h3>
          <p className="text-gray-600">
            {selectedCategory 
              ? 'No se encontraron imágenes para la categoría seleccionada.'
              : 'Aún no hay imágenes en la galería. Los administradores pueden agregar contenido.'
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default ImageGallery;
