const Loading = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-2',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${sizes[size]} border-border border-t-green rounded-full animate-spin`} />
      {text && <span className="text-text2 text-sm">{text}</span>}
    </div>
  );
};

const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`${sizes[size]} border-2 border-bg3 border-t-green rounded-full animate-spin`} />
  );
};

const PageLoader = ({ text = 'Chargement...' }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
    <Spinner size="lg" />
    <p className="text-text2 text-sm">{text}</p>
  </div>
);

const ButtonLoader = () => (
  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
);

export { Loading, Spinner, PageLoader, ButtonLoader };
export default Loading;