import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import operationMonitoring from '@/assets/operation-monitoring.jpg';
import operationContainment from '@/assets/operation-containment.jpg';
import operationConsultancy from '@/assets/operation-consultancy.jpg';
import operationSalvage from '@/assets/operation-salvage.jpg';

interface Operation {
  id: number;
  image: string;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
}

const operations: Operation[] = [
  {
    id: 1,
    image: operationContainment,
    titleKey: "operations.containment.title",
    descriptionKey: "operations.containment.desc",
    categoryKey: "operations.filter.emergency"
  },
  {
    id: 2,
    image: operationMonitoring,
    titleKey: "operations.monitoring.title",
    descriptionKey: "operations.monitoring.desc",
    categoryKey: "operations.filter.monitoring"
  },
  {
    id: 3,
    image: operationConsultancy,
    titleKey: "operations.consultancy.title",
    descriptionKey: "operations.consultancy.desc",
    categoryKey: "operations.filter.consulting"
  },
  {
    id: 4,
    image: operationSalvage,
    titleKey: "operations.salvage.title",
    descriptionKey: "operations.salvage.desc",
    categoryKey: "operations.filter.salvage"
  }
];

const OperationsGallery = () => {
  const [selectedImage, setSelectedImage] = useState<Operation | null>(null);
  const [filter, setFilter] = useState<string>('operations.filter.all');
  const { t } = useLanguage();

  const categories = [
    'operations.filter.all', 
    'operations.filter.emergency', 
    'operations.filter.monitoring', 
    'operations.filter.consulting', 
    'operations.filter.salvage'
  ];

  const filteredOperations = filter === 'operations.filter.all' 
    ? operations 
    : operations.filter(op => op.categoryKey === filter);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {t('operations.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('operations.subtitle')}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((categoryKey) => (
            <Button
              key={categoryKey}
              variant={filter === categoryKey ? "default" : "outline"}
              onClick={() => setFilter(categoryKey)}
              className={`${
                filter === categoryKey 
                  ? "bg-primary hover:bg-primary-hover text-primary-foreground" 
                  : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              {t(categoryKey)}
            </Button>
          ))}
        </div>

        {/* Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredOperations.map((operation, index) => (
            <div
              key={operation.id}
              className="group relative overflow-hidden rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedImage(operation)}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={operation.image}
                  alt={t(operation.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-semibold mb-2">{t(operation.titleKey)}</h3>
                  <p className="text-sm opacity-90">{t(operation.descriptionKey)}</p>
                </div>
                
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                  {t(operation.categoryKey)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage.image}
                  alt={t(selectedImage.titleKey)}
                  className="w-full h-auto rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t(selectedImage.titleKey)}
                  </h3>
                  <p className="text-white/90">
                    {t(selectedImage.descriptionKey)}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default OperationsGallery;