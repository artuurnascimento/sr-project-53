import SEO from '@/components/SEO';
import { useState } from 'react';
import { Search, Filter, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CTASection from '@/components/sections/CTASection';
import galleryContainment1 from '@/assets/gallery-containment-1.jpg';
import galleryEmergency1 from '@/assets/gallery-emergency-1.jpg';
import galleryMonitoring1 from '@/assets/gallery-monitoring-1.jpg';
import galleryTraining1 from '@/assets/gallery-training-1.jpg';
import gallerySalvage1 from '@/assets/gallery-salvage-1.jpg';
import galleryConsultation1 from '@/assets/gallery-consultation-1.jpg';
import galleryLaboratory1 from '@/assets/gallery-laboratory-1.jpg';
import galleryBarriers1 from '@/assets/gallery-barriers-1.jpg';
import galleryMaintenance1 from '@/assets/gallery-maintenance-1.jpg';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  description: string;
  image: string;
  tags: string[];
}

const galleryItems: GalleryItem[] = [
  {
    id: "containment-operation-1",
    title: "Operação de Contenção - Porto de Santos",
    category: "Contenção Marítima",
    location: "Santos - SP",
    date: "Março 2024",
    description: "Implantação de barreiras de contenção flutuantes para controle de vazamento de óleo combustível",
    image: galleryContainment1,
    tags: ["contenção", "marítimo", "óleo", "emergência"]
  },
  {
    id: "emergency-response-1",
    title: "Equipe de Resposta Rápida",
    category: "Emergência",
    location: "Cubatão - SP",
    date: "Janeiro 2024",
    description: "Mobilização de equipe especializada para atendimento a emergência ambiental industrial",
    image: galleryEmergency1,
    tags: ["emergência", "equipe", "industrial", "resposta"]
  },
  {
    id: "monitoring-equipment-1",
    title: "Equipamentos de Monitoramento",
    category: "Monitoramento",
    location: "Bacia de Santos",
    date: "Dezembro 2023",
    description: "Sensores automatizados para monitoramento contínuo da qualidade da água",
    image: galleryMonitoring1,
    tags: ["monitoramento", "sensores", "água", "automação"]
  },
  {
    id: "training-session-1",
    title: "Treinamento de Equipes",
    category: "Treinamento",
    location: "Camaçari - BA",
    date: "Setembro 2023",
    description: "Capacitação de funcionários em procedimentos de resposta a emergências ambientais",
    image: galleryTraining1,
    tags: ["treinamento", "capacitação", "procedimentos", "emergência"]
  },
  {
    id: "salvage-operation-1",
    title: "Operação de Salvatagem",
    category: "Salvatagem",
    location: "São Sebastião - SP",
    date: "Outubro 2023",
    description: "Reflutuação de embarcação encalhada com uso de rebocadores especializados",
    image: gallerySalvage1,
    tags: ["salvatagem", "reboque", "embarcação", "marítimo"]
  },
  {
    id: "consultation-meeting-1",
    title: "Reunião de Consultoria",
    category: "Consultoria",
    location: "Parauapebas - PA",
    date: "Novembro 2023",
    description: "Desenvolvimento de Plano de Emergência Individual com equipe técnica do cliente",
    image: galleryConsultation1,
    tags: ["consultoria", "PEI", "planejamento", "reunião"]
  },
  {
    id: "laboratory-analysis-1",
    title: "Análises Laboratoriais",
    category: "Monitoramento",
    location: "São Paulo - SP",
    date: "Dezembro 2023",
    description: "Análises químicas e microbiológicas de amostras coletadas em campo",
    image: galleryLaboratory1,
    tags: ["laboratório", "análises", "química", "microbiologia"]
  },
  {
    id: "barrier-installation-1",
    title: "Instalação de Barreiras",
    category: "Contenção Terrestre",
    location: "Paulínia - SP",
    date: "Fevereiro 2024",
    description: "Implantação de sistema de contenção terrestre para prevenção de contaminação do solo",
    image: galleryBarriers1,
    tags: ["barreiras", "terrestre", "solo", "prevenção"]
  },
  {
    id: "equipment-maintenance-1",
    title: "Manutenção de Equipamentos",
    category: "Manutenção",
    location: "Rio de Janeiro - RJ",
    date: "Janeiro 2024",
    description: "Manutenção preventiva e calibração de equipamentos de resposta a emergências",
    image: galleryMaintenance1,
    tags: ["manutenção", "equipamentos", "calibração", "preventiva"]
  }
];

const Gallery = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "Galeria de Projetos - Sirius Ambiental",
    "description": "Galeria fotográfica mostrando operações de emergência ambiental, contenção de vazamentos, salvatagem marítima e projetos especializados.",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": 9,
      "itemListElement": [
        {
          "@type": "ImageObject",
          "name": "Operação de Contenção - Porto de Santos",
          "contentUrl": "/src/assets/gallery-containment-1.jpg"
        },
        {
          "@type": "ImageObject",
          "name": "Equipe de Resposta Rápida",
          "contentUrl": "/src/assets/gallery-emergency-1.jpg"
        }
      ]
    }
  };
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const categories = ["all", ...new Set(galleryItems.map(item => item.category))];

  const filteredItems = galleryItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Contenção Marítima": "bg-blue-100 text-blue-800",
      "Emergência": "bg-red-100 text-red-800",
      "Monitoramento": "bg-green-100 text-green-800",
      "Consultoria": "bg-purple-100 text-purple-800",
      "Salvatagem": "bg-orange-100 text-orange-800",
      "Treinamento": "bg-yellow-100 text-yellow-800",
      "Contenção Terrestre": "bg-indigo-100 text-indigo-800",
      "Manutenção": "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Galeria de Projetos"
        description="Acompanhe nossos principais projetos e operações através de imagens que mostram nossa expertise em emergências ambientais."
        keywords="galeria projetos, fotos operações, emergências ambientais, contenção vazamentos, salvatagem marítima, equipe ação"
        type="website"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center text-white animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Galeria de Projetos
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Acompanhe nossos principais projetos e operações através de imagens que 
              mostram nossa expertise em ação
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.slice(1).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} de {galleryItems.length} projetos
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-gradient-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id}
                className="group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 bg-white">
                  <div className="relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline-light" 
                            size="sm"
                            onClick={() => setSelectedImage(item)}
                          >
                            <ZoomIn className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          {selectedImage && (
                            <div className="space-y-4">
                              <img
                                src={selectedImage.image}
                                alt={selectedImage.title}
                                className="w-full h-96 object-cover rounded-lg"
                              />
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">
                                      {selectedImage.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                      <span>{selectedImage.location}</span>
                                      <span>{selectedImage.date}</span>
                                    </div>
                                  </div>
                                  <Badge className={getCategoryColor(selectedImage.category)}>
                                    {selectedImage.category}
                                  </Badge>
                                </div>
                                
                                <p className="text-muted-foreground leading-relaxed">
                                  {selectedImage.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                  {selectedImage.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getCategoryColor(item.category)} >
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      📍 {item.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum projeto encontrado com os filtros selecionados.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchTerm("");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
          
          {/* Load More Button */}
          {filteredItems.length > 0 && (
            <div className="text-center mt-12">
              <Button 
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Carregar Mais Projetos
              </Button>
            </div>
          )}
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default Gallery;