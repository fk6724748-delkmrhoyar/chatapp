import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Button } from './ui/Button';
import { MessageCircle } from 'lucide-react';

export default function AuthScreen({ isAdminRoute }: { isAdminRoute?: boolean }) {
  const login = useAppStore(state => state.login);
  const signup = useAppStore(state => state.signup);
  const systemSettings = useAppStore(state => state.systemSettings);
  const appName = systemSettings?.appName || "Umar Chat";
  
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); // Email, Phone, or Username
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [authError, setAuthError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        login(identifier, password);
      } else {
        signup(email, phone, username, name, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#e4e1de] font-sans p-4">
      <div className="w-[480px] max-w-full bg-white shadow-2xl rounded-sm flex flex-col px-8 py-10 items-center text-center">
         <MessageCircle className={`w-16 h-16 ${isAdminRoute ? 'text-gray-800' : 'text-[#00a884]'} mb-4`} />
         <h1 className="text-3xl font-light text-[#111b21] mb-2">{isAdminRoute ? 'Admin Gateway' : appName}</h1>
         <p className="text-[#667781] mb-6 text-sm">
            {isAdminRoute 
              ? 'Enter your administrator credentials to continue.' 
              : isLogin ? 'Sign in with Username, Email, or Phone.' : 'Create your chat account.'}
         </p>

         {authError && <div className="text-red-500 text-sm mb-4 w-full bg-red-50 p-2 rounded border border-red-200">{authError}</div>}

         <form onSubmit={handleAuth} className="w-full flex flex-col gap-4 text-left">
           {isLogin ? (
             <>
               <div>
                 <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Username, Email, or Phone</label>
                 <input 
                   type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)}
                   className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-4 outline-none text-sm text-[#111b21] border border-transparent focus:border-[#00a884]"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Password</label>
                 <input 
                   type="password" required value={password} onChange={e => setPassword(e.target.value)}
                   className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-4 outline-none text-sm text-[#111b21] border border-transparent focus:border-[#00a884]"
                 />
               </div>
             </>
           ) : (
             <>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Username *</label>
                   <input required type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-3 outline-none text-sm" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Display Name *</label>
                   <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-3 outline-none text-sm" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Phone Number</label>
                   <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-3 outline-none text-sm" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Email *</label>
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-3 outline-none text-sm" />
                 </div>
                 <div className="col-span-2">
                   <label className="text-xs font-bold text-[#54656f] uppercase block mb-1">Password *</label>
                   <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#f0f2f5] rounded-md py-2.5 px-3 outline-none text-sm" />
                 </div>
               </div>
             </>
           )}
           <Button type="submit" className={`w-full ${isAdminRoute ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#00a884] hover:bg-[#008f6f]'} text-white rounded-full mt-2 py-5 font-bold`}>
             {isLogin ? 'Secure Login' : 'Register Account'}
           </Button>
         </form>

         {!isAdminRoute && (
           <div className="mt-6 text-sm text-[#667781]">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); }} className="text-[#00a884] hover:underline font-bold">
               {isLogin ? 'Sign Up' : 'Sign In'}
             </button>
           </div>
         )}
      </div>
    </div>
  );
}
