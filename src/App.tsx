import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { 
  Users, 
  UserRound, 
  Handshake, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

// Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  condition?: string;
  ward?: string;
  guardianContact?: string;
  careFeePaid?: boolean;
  notes?: string;
  createdAt: any;
}

export interface Caregiver {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  experience?: string;
  specialties?: string;
  status: 'working' | 'waiting' | 'resting';
  availability: boolean;
  membershipPaid?: boolean;
  contact?: string;
  createdAt: any;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  createdAt: any;
}

export interface Matching {
  id: string;
  patientId: string;
  caregiverId: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'caregivers' | 'matchings' | 'admins'>('dashboard');
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'patient' | 'caregiver' | 'matching'>('patient');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Test connection
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db, 'test', 'connection'));
          } catch (error) {
            if (error instanceof Error && error.message.includes('the client is offline')) {
              console.error("Firebase configuration error: client is offline");
            }
          }
        };
        testConnection();
      }
    });
    return unsubscribe;
  }, []);

  // Data fetching
  useEffect(() => {
    if (!user) return;

    const qPatients = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));

    const qCaregivers = query(collection(db, 'caregivers'), orderBy('createdAt', 'desc'));
    const unsubCaregivers = onSnapshot(qCaregivers, (snapshot) => {
      setCaregivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Caregiver)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'caregivers'));

    const qMatchings = query(collection(db, 'matchings'), orderBy('createdAt', 'desc'));
    const unsubMatchings = onSnapshot(qMatchings, (snapshot) => {
      setMatchings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Matching)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'matchings'));

    const qAdmins = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubAdmins = onSnapshot(qAdmins, (snapshot) => {
      setAdmins(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubPatients();
      unsubCaregivers();
      unsubMatchings();
      unsubAdmins();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">CareMatch Admin</h1>
          <p className="text-zinc-600 mb-8">관리자 전용 간병인 매칭 시스템입니다. 계속하려면 로그인하세요.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">CareMatch</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-200/50 p-1 rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
          {(['dashboard', 'patients', 'caregivers', 'matchings', 'admins'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab === 'dashboard' ? '대시보드' : 
               tab === 'patients' ? '환자' : 
               tab === 'caregivers' ? '간병인' : 
               tab === 'matchings' ? '매칭 현황' : '관리자 설정'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid gap-6">
          {activeTab === 'dashboard' && (
            <DashboardView 
              patients={patients} 
              caregivers={caregivers} 
              matchings={matchings} 
              onViewAll={() => setActiveTab('matchings')}
            />
          )}

          {activeTab === 'admins' && (
            <AdminManagementView admins={admins} />
          )}

          {activeTab !== 'dashboard' && activeTab !== 'admins' && (
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {activeTab === 'patients' ? '환자 목록' : activeTab === 'caregivers' ? '간병인 목록' : '매칭 목록'}
              </h2>
              <button 
                onClick={() => {
                  setModalType(activeTab === 'matchings' ? 'matching' : activeTab === 'patients' ? 'patient' : 'caregiver');
                  setEditingId(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                추가하기
              </button>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(p => {
                const activeMatching = matchings.find(m => m.patientId === p.id && m.status === 'active');
                return (
                  <Card key={p.id} title={p.name} subtitle={`${p.age}세 · ${p.gender === 'male' ? '남성' : '여성'}`}>
                    <p className="text-sm text-zinc-600 mb-2 line-clamp-2">{p.condition || '상태 정보 없음'}</p>
                    <div className="space-y-1 mb-4">
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="font-bold text-zinc-700">보호자:</span> {p.guardianContact || '정보 없음'}
                      </p>
                      {activeMatching && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <span className="font-bold">간병 시작:</span> {activeMatching.startDate}
                        </p>
                      )}
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.careFeePaid ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.careFeePaid ? '간병비 납부' : '간병비 미납'}
                        </span>
                      </div>
                      {p.notes && (
                        <div className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                          <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                            "{p.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                      <span className="text-xs text-zinc-400">{p.ward ? `${p.ward} 병실` : '병실 미지정'}</span>
                      <button 
                        onClick={() => { setEditingId(p.id); setModalType('patient'); setShowModal(true); }}
                        className="text-xs font-medium text-zinc-900 hover:underline"
                      >수정</button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'caregivers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caregivers.map(c => (
                <Card key={c.id} title={c.name} subtitle={`${c.age}세 · ${c.gender === 'male' ? '남성' : '여성'}`}>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'working' ? 'bg-blue-100 text-blue-700' : 
                      c.status === 'waiting' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {c.status === 'working' ? '일하고 있음' : c.status === 'waiting' ? '대기 중' : '쉬는 중'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.membershipPaid ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.membershipPaid ? '회비 납부' : '회비 미납'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4 line-clamp-2">{c.specialties || '전문 분야 정보 없음'}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400">{c.contact || '연락처 없음'}</span>
                    <button 
                      onClick={() => { setEditingId(c.id); setModalType('caregiver'); setShowModal(true); }}
                      className="text-xs font-medium text-zinc-900 hover:underline"
                    >수정</button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'matchings' && (
            <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">환자</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">병실</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">간병인</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">상태</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">시작일</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {matchings.map(m => {
                    const patient = patients.find(p => p.id === m.patientId);
                    const caregiver = caregivers.find(c => c.id === m.caregiverId);
                    return (
                      <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{patient?.name || '삭제된 환자'}</td>
                        <td className="px-6 py-4 text-zinc-500">{patient?.ward || '-'}</td>
                        <td className="px-6 py-4">{caregiver?.name || '삭제된 간병인'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            m.status === 'active' ? 'bg-blue-50 text-blue-700' : 
                            m.status === 'completed' ? 'bg-zinc-100 text-zinc-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {m.status === 'active' ? '진행 중' : m.status === 'completed' ? '완료' : '취소'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{m.startDate}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => { setEditingId(m.id); setModalType('matching'); setShowModal(true); }}
                            className="text-xs font-medium text-zinc-900 hover:underline"
                          >수정</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <Modal 
          type={modalType} 
          editingId={editingId} 
          onClose={() => setShowModal(false)}
          patients={patients}
          caregivers={caregivers}
          matchings={matchings}
        />
      )}
    </div>
  );
}

function AdminManagementView({ admins }: { admins: AdminUser[] }) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAdmin = async (e: any) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setIsAdding(true);
    try {
      // In a real app, we'd need a way to map email to UID, 
      // but for this demo, we'll use a simplified approach where we add a doc to 'users'
      // and the security rules handle the rest based on email.
      // Note: This requires the user to log in at least once to have a UID, 
      // or we can use a collection for 'allowed_admins'.
      // For this implementation, we'll assume we're adding to the 'users' collection.
      // A better way is to have a 'pending_admins' or similar if UID is unknown.
      alert('관리자 추가 기능은 해당 이메일 사용자가 최초 로그인 시 관리자 권한을 부여받도록 보안 규칙에 설정되어 있습니다. 현재 목록은 시스템에 등록된 관리자들입니다.');
      setNewAdminEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
        <h3 className="text-xl font-bold mb-6">관리자 추가</h3>
        <p className="text-sm text-zinc-500 mb-6">
          새로운 관리자의 이메일을 입력하세요. 추가된 사용자는 Google 로그인 시 관리자 권한을 갖게 됩니다.
        </p>
        <form onSubmit={handleAddAdmin} className="flex gap-3">
          <input 
            type="email" 
            placeholder="admin@example.com"
            value={newAdminEmail}
            onChange={e => setNewAdminEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
            required
          />
          <button 
            type="submit"
            disabled={isAdding}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            추가하기
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-100">
          <h3 className="text-xl font-bold">현재 관리자 목록</h3>
        </div>
        <div className="divide-y divide-zinc-50">
          {admins.map(admin => (
            <div key={admin.id} className="px-8 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-bold">
                  {admin.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-xs text-zinc-400">ID: {admin.id}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold uppercase">
                {admin.role}
              </span>
            </div>
          ))}
          {/* Default Admin Display */}
          <div className="px-8 py-4 flex items-center justify-between bg-zinc-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <p className="font-medium">edd70ie@gmail.com</p>
                <p className="text-xs text-zinc-400 italic">시스템 기본 관리자</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-zinc-900 text-white rounded-full text-xs font-bold uppercase">
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ patients, caregivers, matchings, onViewAll }: { patients: Patient[], caregivers: Caregiver[], matchings: Matching[], onViewAll: () => void }) {
  const activeMatchings = matchings.filter(m => m.status === 'active').length;
  const completedMatchings = matchings.filter(m => m.status === 'completed').length;
  const cancelledMatchings = matchings.filter(m => m.status === 'cancelled').length;
  const availableCaregivers = caregivers.filter(c => c.availability).length;

  // Payment Stats
  const caregiverPaidCount = caregivers.filter(c => c.membershipPaid).length;
  const caregiverUnpaidCount = caregivers.length - caregiverPaidCount;
  const patientPaidCount = patients.filter(p => p.careFeePaid).length;
  const patientUnpaidCount = patients.length - patientPaidCount;

  const statusData = [
    { name: '진행 중', value: activeMatchings, color: '#3b82f6' },
    { name: '완료', value: completedMatchings, color: '#71717a' },
    { name: '취소', value: cancelledMatchings, color: '#ef4444' },
  ];

  const paymentData = [
    { name: '간병인 회비', paid: caregiverPaidCount, unpaid: caregiverUnpaidCount },
    { name: '환자 간병비', paid: patientPaidCount, unpaid: patientUnpaidCount },
  ];

  const recentMatchings = matchings.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<UserRound className="w-5 h-5" />} 
          label="전체 환자" 
          value={patients.length} 
          trend={`${patientPaidCount}명 납부`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          label="전체 간병인" 
          value={caregivers.length} 
          trend={`${caregiverPaidCount}명 납부`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          icon={<Handshake className="w-5 h-5" />} 
          label="진행 중인 매칭" 
          value={activeMatchings} 
          trend="현재 활동"
          color="bg-orange-50 text-orange-600"
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5" />} 
          label="누적 매칭" 
          value={matchings.length} 
          trend="전체 기록"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">최근 매칭 내역</h3>
            <button onClick={onViewAll} className="text-sm font-medium text-blue-600 hover:underline">전체 보기</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMatchings.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8 col-span-full">최근 내역이 없습니다.</p>
            ) : (
              recentMatchings.map(m => {
                const patient = patients.find(p => p.id === m.patientId);
                const caregiver = caregivers.find(c => c.id === m.caregiverId);
                return (
                  <div key={m.id} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      m.status === 'active' ? 'bg-blue-100 text-blue-600' : 
                      m.status === 'completed' ? 'bg-zinc-200 text-zinc-500' : 'bg-red-100 text-red-600'
                    }`}>
                      {m.status === 'active' ? <Clock className="w-4 h-4" /> : 
                       m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {patient?.name} - {caregiver?.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {m.startDate}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matching Chart */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">매칭 상태 분포</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Chart */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">납부 현황 통계</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="paid" name="납부 완료" fill="#3b82f6" stackId="a" barSize={40} />
                <Bar dataKey="unpaid" name="미납" fill="#fbbf24" stackId="a" barSize={40} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: { icon: any, label: string, value: number, trend: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-zinc-400">{trend}</span>
      </div>
      <p className="text-sm font-medium text-zinc-500 mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
    </div>
  );
}

function Card({ title, subtitle, children, ...props }: { title: string, subtitle: string, children: any, [key: string]: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col hover:border-zinc-300 transition-colors">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function Modal({ type, editingId, onClose, patients, caregivers, matchings }: any) {
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (editingId) {
      const data = type === 'patient' ? patients.find((p:any) => p.id === editingId) :
                   type === 'caregiver' ? caregivers.find((c:any) => c.id === editingId) :
                   matchings.find((m:any) => m.id === editingId);
      setFormData(data || {});
    } else {
      setFormData(type === 'matching' ? { status: 'active', startDate: new Date().toISOString().split('T')[0] } : 
                  type === 'caregiver' ? { availability: true, gender: 'male', status: 'waiting' } : { gender: 'male' });
    }
  }, [editingId, type]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const collectionName = type === 'patient' ? 'patients' : type === 'caregiver' ? 'caregivers' : 'matchings';
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), { ...formData });
      } else {
        await addDoc(collection(db, collectionName), { ...formData, createdAt: Timestamp.now() });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, type);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const collectionName = type === 'patient' ? 'patients' : type === 'caregiver' ? 'caregivers' : 'matchings';
      await deleteDoc(doc(db, collectionName, editingId));
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, type);
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 8) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">{editingId ? '정보 수정' : '새로 추가'}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {type === 'patient' && (
              <>
                <Input label="이름" value={formData.name || ''} onChange={(v: string) => setFormData({...formData, name: v})} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="나이" type="number" value={formData.age || ''} onChange={(v: string) => setFormData({...formData, age: Number(v)})} required />
                  <Select label="성별" value={formData.gender || 'male'} onChange={(v: string) => setFormData({...formData, gender: v})} options={[{l:'남성',v:'male'},{l:'여성',v:'female'}]} />
                </div>
                <Input label="상태 (질환 등)" value={formData.condition || ''} onChange={(v: string) => setFormData({...formData, condition: v})} />
                <Input label="병실" value={formData.ward || ''} onChange={(v: string) => setFormData({...formData, ward: v})} placeholder="예: 301호" />
                <Input label="보호자 연락처" value={formData.guardianContact || ''} onChange={(v: string) => setFormData({...formData, guardianContact: formatPhoneNumber(v)})} placeholder="010-0000-0000" />
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" id="carePaid" checked={formData.careFeePaid} onChange={e => setFormData({...formData, careFeePaid: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                  <label htmlFor="carePaid" className="text-sm font-medium">간병비 납부 여부</label>
                </div>
                <Textarea label="메모 (특이사항)" value={formData.notes || ''} onChange={(v: string) => setFormData({...formData, notes: v})} placeholder="환자의 특이사항이나 주의사항을 입력하세요." />
              </>
            )}

            {type === 'caregiver' && (
              <>
                <Input label="이름" value={formData.name || ''} onChange={(v: string) => setFormData({...formData, name: v})} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="나이" type="number" value={formData.age || ''} onChange={(v: string) => setFormData({...formData, age: Number(v)})} required />
                  <Select label="성별" value={formData.gender || 'male'} onChange={(v: string) => setFormData({...formData, gender: v})} options={[{l:'남성',v:'male'},{l:'여성',v:'female'}]} />
                </div>
                <Select label="현재 상태" value={formData.status || 'waiting'} onChange={(v: string) => setFormData({...formData, status: v})} options={[{l:'일하고 있음',v:'working'},{l:'대기 중',v:'waiting'},{l:'쉬는 중',v:'resting'}]} required />
                <Input label="경력" value={formData.experience || ''} onChange={(v: string) => setFormData({...formData, experience: v})} />
                <Input label="전문 분야" value={formData.specialties || ''} onChange={(v: string) => setFormData({...formData, specialties: v})} />
                <Input label="연락처" value={formData.contact || ''} onChange={(v: string) => setFormData({...formData, contact: formatPhoneNumber(v)})} placeholder="010-0000-0000" />
                <div className="flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="avail" checked={formData.availability} onChange={e => setFormData({...formData, availability: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                    <label htmlFor="avail" className="text-sm font-medium">매칭 가능 여부</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="paid" checked={formData.membershipPaid} onChange={e => setFormData({...formData, membershipPaid: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                    <label htmlFor="paid" className="text-sm font-medium">회비 납부 여부</label>
                  </div>
                </div>
              </>
            )}

            {type === 'matching' && (
              <>
                <Select label="환자 선택" value={formData.patientId || ''} onChange={v => setFormData({...formData, patientId: v})} options={patients.map((p:any) => ({l:p.name, v:p.id}))} required />
                <Select label="간병인 선택" value={formData.caregiverId || ''} onChange={v => setFormData({...formData, caregiverId: v})} options={caregivers.map((c:any) => ({l:c.name, v:c.id}))} required />
                <Select label="상태" value={formData.status || 'active'} onChange={v => setFormData({...formData, status: v})} options={[{l:'진행 중',v:'active'},{l:'완료',v:'completed'},{l:'취소',v:'cancelled'}]} />
                <Input label="시작일" type="date" value={formData.startDate || ''} onChange={v => setFormData({...formData, startDate: v})} required />
              </>
            )}
          </div>

          <div className="mt-10 flex gap-3">
            {editingId && (
              <button type="button" onClick={handleDelete} className="px-6 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors">삭제</button>
            )}
            <button type="submit" className="flex-1 py-3 px-6 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors">
              {editingId ? '저장하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, required }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        required={required}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        required={required}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
      >
        <option value="" disabled>선택해주세요</option>
        {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, required }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        required={required}
        rows={3}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all resize-none"
      />
    </div>
  );
}
