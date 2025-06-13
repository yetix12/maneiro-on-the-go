
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, MapPin, Camera } from 'lucide-react';

const images = [
  {
    id: '1',
    title: 'Terminal Pampatar',
    description: 'Estación principal de autobuses en el corazón de Pampatar',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500',
    category: 'Terminal'
  },
  {
    id: '2',
    title: 'Playa El Agua',
    description: 'Una de las playas más hermosas de la Isla de Margarita',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
    category: 'Turismo'
  },
  {
    id: '3',
    title: 'Plaza Bolívar Pampatar',
    description: 'Centro histórico y cultural de Pampatar',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
    category: 'Histórico'
  },
  {
    id: '4',
    title: 'Castillo San Carlos Borromeo',
    description: 'Fortaleza histórica ubicada en Pampatar',
    url: 'https://images.unsplash.com/photo-1465415503959-7e8e0bb8cadf?w=500',
    category: 'Histórico'
  },
  {
    id: '5',
    title: 'Mercado Municipal',
    description: 'Centro de comercio local con productos frescos',
    url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=500',
    category: 'Comercio'
  },
  {
    id: '6',
    title: 'Playa Parguito',
    description: 'Playa popular para deportes acuáticos',
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
    category: 'Turismo'
  }
];

const ImageGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const categories = [...new Set(images.map(img => img.category))];
  const filteredImages = selectedCategory 
    ? images.filter(img => img.category === selectedCategory)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredImages.map((image) => (
          <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(image)}>
            <div className="relative">
              <img 
                src={image.url} 
                alt={image.title}
                className="w-full h-48 object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-blue-600">
                {image.category}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                {image.title}
              </h3>
              <p className="text-gray-600 text-sm">{image.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage.url} 
              alt={selectedImage.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <Badge>{selectedImage.category}</Badge>
              </div>
              <p className="text-gray-600">{selectedImage.description}</p>
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

      {filteredImages.length === 0 && (
        <Card className="p-8 text-center">
          <Image size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No hay imágenes disponibles</h3>
          <p className="text-gray-600">No se encontraron imágenes para la categoría seleccionada.</p>
        </Card>
      )}
    </div>
  );
};

export default ImageGallery;
