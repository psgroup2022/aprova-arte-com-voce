export const ErrorState = ({
  title = 'Erro',
  message = 'Ocorreu um erro inesperado.',
}: {
  title?: string;
  message?: string;
}) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

export default ErrorState;
