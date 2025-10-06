import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import teamAction1 from '@/assets/team-action-1.jpg';
import teamAction2 from '@/assets/team-action-2.jpg';
import teamAction3 from '@/assets/team-action-3.jpg';
import teamAction4 from '@/assets/team-action-4.jpg';
import teamAction5 from '@/assets/team-action-5.jpg';
import teamAction6 from '@/assets/team-action-6.jpg';
import teamAction7 from '@/assets/team-action-7.jpg';
import teamAction8 from '@/assets/team-action-8.jpg';
import teamAction9 from '@/assets/team-action-9.jpg';

const TeamInAction = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  const teamImages = [
    { src: teamAction1, alt: t('teamAction.alt1') },
    { src: teamAction2, alt: t('teamAction.alt2') },
    { src: teamAction3, alt: t('teamAction.alt3') },
    { src: teamAction4, alt: t('teamAction.alt4') },
    { src: teamAction5, alt: t('teamAction.alt5') },
    { src: teamAction6, alt: t('teamAction.alt6') },
    { src: teamAction7, alt: t('teamAction.alt7') },
    { src: teamAction8, alt: t('teamAction.alt8') },
    { src: teamAction9, alt: t('teamAction.alt9') }
  ];


  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {t('teamAction.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('teamAction.description')}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {teamImages.map((image, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div 
                    className="group relative overflow-hidden rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    
                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            {t('teamAction.slideHint')}
          </p>
        </div>

        {/* Lightbox Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-6xl p-0 bg-transparent border-0">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="w-full h-auto rounded-lg max-h-[90vh] object-contain"
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
                  <p className="text-white text-lg">
                    {selectedImage.alt}
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

export default TeamInAction;