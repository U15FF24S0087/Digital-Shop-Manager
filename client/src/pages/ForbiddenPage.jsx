import { useNavigate } from 'react-router-dom';
const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <p className="text-8xl font-black text-slate-200">403</p>
      <h2 className="text-2xl font-bold text-slate-700">Access denied</h2>
      <p className="text-slate-500">You do not have permission to view this page.</p>
      <button className="btn btn-primary mt-2" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
};
export default ForbiddenPage;
