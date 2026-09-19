const Footer = ({ isLoginPage = false }) => {
  return (
    <footer 
      className={`${
        isLoginPage 
          ? 'text-white/70 text-sm' 
          : 'text-gray-400 dark:text-gray-500 text-xs'
      }`}
      style={{
        position: isLoginPage ? 'absolute' : 'fixed',
        bottom: isLoginPage ? '15px' : '8px',
        left: isLoginPage ? '50%' : 'auto',
        right: isLoginPage ? 'auto' : '12px',
        transform: isLoginPage ? 'translateX(-50%)' : 'none',
        width: isLoginPage ? 'auto' : 'auto',
        zIndex: 10,
      }}
    >
      <div className={`flex items-center ${isLoginPage ? 'justify-center' : 'justify-end'} space-x-reverse space-x-1`}>
        <span className={isLoginPage ? '' : 'opacity-60'}> تمام اطلاعات این سیستم مفحوظ به بالتازار پلاس است </span>
      </div>
    </footer>
  );
};

export default Footer;

