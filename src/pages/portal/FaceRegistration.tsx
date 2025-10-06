import { useState } from 'react';
import { ArrowLeft, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortalLayout from '@/components/layout/PortalLayout';
import AdvancedFacialRecognition from '@/components/AdvancedFacialRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const FaceRegistration = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleRegistrationSuccess = () => {
    setRegistrationComplete(true);
    setTimeout(() => {
      navigate('/portal');
    }, 3000);
  };

  if (registrationComplete) {
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-900">Cadastro Concluído!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Seu reconhecimento facial foi cadastrado com sucesso. Agora você pode usar a câmera para bater ponto.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando em alguns segundos...
              </p>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
          <Link to="/portal">
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Cadastrar Reconhecimento Facial
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure seu reconhecimento facial para batimento de ponto
            </p>
          </div>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              {profile?.employee_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Funcionário</p>
                  <p className="font-medium">{profile.employee_id}</p>
                </div>
              )}
              {profile?.department && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                  <p className="font-medium">{profile.department}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Facial Recognition Component */}
        <AdvancedFacialRecognition 
          mode="register" 
          onRegistrationSuccess={handleRegistrationSuccess}
        />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p className="font-medium">Para um cadastro bem-sucedido:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Certifique-se de que seu rosto esteja bem iluminado</li>
                <li>Olhe diretamente para a câmera</li>
                <li>Remova óculos de sol ou objetos que cubram seu rosto</li>
                <li>Mantenha uma expressão neutra</li>
                <li>Use uma imagem clara e de boa qualidade</li>
              </ul>
              
              <p className="font-medium mt-4">Após o cadastro:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Você poderá usar o reconhecimento facial para bater ponto</li>
                <li>O sistema identificará automaticamente seu rosto</li>
                <li>Caso não funcione, você ainda pode usar a localização manual</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default FaceRegistration;