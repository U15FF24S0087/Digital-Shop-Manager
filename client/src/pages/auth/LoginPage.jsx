import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { CubeIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CubeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Digital Shop Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                placeholder="admin@digitalshop.com"
                className="input"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">Demo credentials</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              {[
                { role: 'Admin',   email: 'admin@digitalshop.com',   pass: 'Admin@1234!' },
                { role: 'Manager', email: 'manager@digitalshop.com', pass: 'Manager@1234!' },
                { role: 'Staff',   email: 'staff@digitalshop.com',   pass: 'Staff@1234!' },
              ].map(({ role, email, pass }) => (
                <div key={role} className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-600">{role}</span>
                  <span className="font-mono">{email} / {pass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
