import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { saveTokens } from '../utils/tokenManager';
import Footer from '../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.username.trim()) {
      setError('نام کاربری الزامی است');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('رمز عبور الزامی است');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.login(formData.username, formData.password);
      
      // Extract tokens from response
      const { access, refresh } = response.data;
      
      // Save tokens to localStorage
      saveTokens(access, refresh);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Handle error
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.response?.data?.error ||
                          'ورود ناموفق بود. لطفاً اطلاعات خود را بررسی کنید.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden container" style={{ maxHeight: '100vh', overflowY: 'hidden' }}>
      {/* Content Container */}
      <div className="relative z-20 max-w-md w-full space-y-4">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Batltazar Plus Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
            Batltazar Plus
          </h1>
          <p className="text-base md:text-lg text-white/90 font-medium mb-3 drop-shadow-md">
            صفحه ورود کاربران تیم بالتازار پلاس
          </p>
          <div className="h-1 w-24 bg-white/30 mx-auto rounded-full"></div>
        </div>

        <div className="flex justify-center">
          <div className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="title">ورود به حساب کاربری</div>

            <label className="label_input" htmlFor="username-input">نام کاربری</label>
            <input
              spellCheck="false"
              className="input"
              type="text"
              name="username"
              id="username-input"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />

            <div className="frg_pss">
              <label className="label_input" htmlFor="password-input">رمز عبور</label>
            </div>
            <div className="password-wrapper">
              <input
                spellCheck="false"
                className="input"
                type={showPassword ? "text" : "password"}
                name="password"
                id="password-input"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="blind_input"
              >
                <span className={showPassword ? "hide" : "show"}>نمایش</span>
                <span className={showPassword ? "show" : "hide"}>مخفی</span>
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <button 
              className="submit" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>
          </div>
        </div>
      </div>

      <Footer isLoginPage={true} />

      <style>{`
        /* Ensure body and html are dark for login page */
        body, html, #root {
          background-color: #000 !important;
          margin: 0;
          padding: 0;
        }

        /* Override light mode for login page */
        @media (prefers-color-scheme: light) {
          body, html, #root {
            background-color: #000 !important;
          }
        }

        /* Container Rain Background */
        .container::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          backdrop-filter: blur(1em) brightness(6);
          background-image: radial-gradient(
            circle at 50% 50%,
            #0000 0,
            #0000 2px,
            hsl(0 0 4%) 2px
          );
          background-size: 8px 8px;
        }

        .container {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 100vh;
          --c: #09f;
          background-color: #000 !important;
          background-image: radial-gradient(4px 100px at 0px 235px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 235px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 117.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 252px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 252px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 126px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 150px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 150px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 75px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 253px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 253px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 126.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 204px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 204px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 102px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 134px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 134px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 67px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 179px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 179px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 89.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 299px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 299px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 149.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 215px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 215px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 107.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 281px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 281px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 140.5px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 158px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 158px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 79px, var(--c) 100%, #0000 150%),
            radial-gradient(4px 100px at 0px 210px, var(--c), #0000),
            radial-gradient(4px 100px at 300px 210px, var(--c), #0000),
            radial-gradient(1.5px 1.5px at 150px 105px, var(--c) 100%, #0000 150%);
          background-size:
            300px 235px,
            300px 235px,
            300px 235px,
            300px 252px,
            300px 252px,
            300px 252px,
            300px 150px,
            300px 150px,
            300px 150px,
            300px 253px,
            300px 253px,
            300px 253px,
            300px 204px,
            300px 204px,
            300px 204px,
            300px 134px,
            300px 134px,
            300px 134px,
            300px 179px,
            300px 179px,
            300px 179px,
            300px 299px,
            300px 299px,
            300px 299px,
            300px 215px,
            300px 215px,
            300px 215px,
            300px 281px,
            300px 281px,
            300px 281px,
            300px 158px,
            300px 158px,
            300px 158px,
            300px 210px,
            300px 210px,
            300px 210px;
          animation: hi 150s linear infinite;
        }

        @keyframes hi {
          0% {
            background-position:
              0px 220px,
              3px 220px,
              151.5px 337.5px,
              25px 24px,
              28px 24px,
              176.5px 150px,
              50px 16px,
              53px 16px,
              201.5px 91px,
              75px 224px,
              78px 224px,
              226.5px 350.5px,
              100px 19px,
              103px 19px,
              251.5px 121px,
              125px 120px,
              128px 120px,
              276.5px 187px,
              150px 31px,
              153px 31px,
              301.5px 120.5px,
              175px 235px,
              178px 235px,
              326.5px 384.5px,
              200px 121px,
              203px 121px,
              351.5px 228.5px,
              225px 224px,
              228px 224px,
              376.5px 364.5px,
              250px 26px,
              253px 26px,
              401.5px 105px,
              275px 75px,
              278px 75px,
              426.5px 180px;
          }

          to {
            background-position:
              0px 6800px,
              3px 6800px,
              151.5px 6917.5px,
              25px 13632px,
              28px 13632px,
              176.5px 13758px,
              50px 5416px,
              53px 5416px,
              201.5px 5491px,
              75px 17175px,
              78px 17175px,
              226.5px 17301.5px,
              100px 5119px,
              103px 5119px,
              251.5px 5221px,
              125px 8428px,
              128px 8428px,
              276.5px 8495px,
              150px 9876px,
              153px 9876px,
              301.5px 9965.5px,
              175px 13391px,
              178px 13391px,
              326.5px 13540.5px,
              200px 14741px,
              203px 14741px,
              351.5px 14848.5px,
              225px 18770px,
              228px 18770px,
              376.5px 18910.5px,
              250px 5082px,
              253px 5082px,
              401.5px 5161px,
              275px 6375px,
              278px 6375px,
              426.5px 6480px;
          }
        }

        /* From Uiverse.io by ilkhoeri - Dark Theme */
        .card {
          --p: 24px;
          --h-form: auto;
          --w-form: 380px;
          --input-px: 0.75rem;
          --input-py: 0.65rem;
          --submit-h: 38px;
          --blind-w: 64px;
          --space-y: 0.5rem;
          width: var(--w-form);
          max-width: 100%;
          border-radius: 16px;
          background: #1f2937;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          flex-direction: column;
          overflow: hidden;
          padding: var(--p);
          -webkit-font-smoothing: antialiased;
          -webkit-user-select: none;
          user-select: none;
          font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
            "Lucida Sans", Arial, sans-serif;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        }

        .password-wrapper {
          position: relative;
          width: 100%;
        }

        .password-wrapper .blind_input {
          -webkit-user-select: none;
          user-select: none;
          cursor: pointer;
          z-index: 4;
          position: absolute;
          border: none;
          right: calc(var(--input-px) / 2);
          top: 50%;
          transform: translateY(-50%);
          padding: 4px 8px;
          border-radius: 4px;
          background-color: #374151;
          color: #d1d5db;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        .password-wrapper .blind_input:before {
          content: "";
          position: absolute;
          left: -1px;
          top: 0;
          height: 100%;
          width: 1px;
          background: #6b7280;
        }
        .password-wrapper .blind_input:hover {
          color: #f3f4f6;
          background-color: #4b5563;
        }
        .password-wrapper .blind_input .hide {
          display: none;
        }
        .password-wrapper .blind_input .show {
          display: block;
        }

        .form {
          order: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          flex-direction: column;
          width: 100%;
        }

        .form .title {
          width: 100%;
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 1rem;
          padding-top: 0;
          padding-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .form .label_input {
          white-space: nowrap;
          font-size: 1rem;
          margin-top: calc(var(--space-y) / 2);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          display: inline;
          text-align: left;
          margin-right: auto;
          position: relative;
          z-index: 99;
          -webkit-user-select: none;
          user-select: none;
        }

        .form .input {
          resize: vertical;
          background: #111827;
          border: 1px solid #4b5563;
          border-radius: 6px;
          outline: none;
          padding: var(--input-py) var(--input-px);
          font-size: 18px;
          width: 100%;
          color: #f3f4f6;
          margin: var(--space-y) 0;
          transition: all 0.25s ease;
        }
        .password-wrapper .input {
          padding-right: calc(var(--blind-w) + var(--input-px) + 4px);
        }
        .form .input:focus {
          border: 1px solid #3b82f6;
          outline: 0;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        .form .input::placeholder {
          color: #6b7280;
        }
        .form .input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form .frg_pss {
          width: 100%;
          display: inline-flex;
          align-items: center;
        }

        .form .submit {
          height: var(--submit-h);
          width: 100%;
          outline: none;
          cursor: pointer;
          background-color: #3b82f6;
          background-image: linear-gradient(
            -180deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(0, 0, 0, 0.1) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.3);
          font-weight: 500;
          letter-spacing: 0.25px;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
          text-align: center;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          -webkit-appearance: button;
          appearance: button;
          margin: var(--space-y) 0 0;
          transition: all 0.25s ease;
        }
        .form .submit:hover:not(:disabled) {
          background-color: #2563eb;
          background-image: linear-gradient(
            -180deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(0, 0, 0, 0.15) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.5);
        }
        .form .submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          width: 100%;
          padding: 0.75rem;
          margin-top: 0.5rem;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 0.875rem;
        }

      `}</style>
    </div>
  );
};

export default Login;

