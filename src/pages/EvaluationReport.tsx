import React, { useState, useEffect } from 'react';
import { getAllCVs } from '../services/cvService';
import { CVData } from '../types/cv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Star, Download } from 'lucide-react';

const EvaluationReport: React.FC = () => {
  const [cvList, setCVList] = useState<CVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResponses: 0,
    averageWorkSatisfaction: 0,
    averageFacilitiesSatisfaction: 0,
    averageLongTermIntent: 0,
    averageRecommendation: 0,
    averageApplicationSatisfaction: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllCVs();
        const evaluatedCVs = data.filter(cv => cv.evaluation && (
          cv.evaluation.workSatisfaction > 0 ||
          cv.evaluation.facilitiesSatisfaction > 0 ||
          cv.evaluation.longTermIntent > 0 ||
          cv.evaluation.recommendation > 0 ||
          cv.evaluation.applicationSatisfaction > 0
        ));
        
        setCVList(evaluatedCVs);
        calculateStats(evaluatedCVs);
      } catch (error) {
        console.error('Error loading CVs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateStats = (cvs: CVData[]) => {
    if (cvs.length === 0) {
      setStats({
        totalResponses: 0,
        averageWorkSatisfaction: 0,
        averageFacilitiesSatisfaction: 0,
        averageLongTermIntent: 0,
        averageRecommendation: 0,
        averageApplicationSatisfaction: 0
      });
      return;
    }

    const totals = cvs.reduce((acc, cv) => {
      if (cv.evaluation) {
        acc.workSatisfaction += cv.evaluation.workSatisfaction || 0;
        acc.facilitiesSatisfaction += cv.evaluation.facilitiesSatisfaction || 0;
        acc.longTermIntent += cv.evaluation.longTermIntent || 0;
        acc.recommendation += cv.evaluation.recommendation || 0;
        acc.applicationSatisfaction += cv.evaluation.applicationSatisfaction || 0;
      }
      return acc;
    }, {
      workSatisfaction: 0,
      facilitiesSatisfaction: 0,
      longTermIntent: 0,
      recommendation: 0,
      applicationSatisfaction: 0
    });

    setStats({
      totalResponses: cvs.length,
      averageWorkSatisfaction: Number((totals.workSatisfaction / cvs.length).toFixed(1)),
      averageFacilitiesSatisfaction: Number((totals.facilitiesSatisfaction / cvs.length).toFixed(1)),
      averageLongTermIntent: Number((totals.longTermIntent / cvs.length).toFixed(1)),
      averageRecommendation: Number((totals.recommendation / cvs.length).toFixed(1)),
      averageApplicationSatisfaction: Number((totals.applicationSatisfaction / cvs.length).toFixed(1))
    });
  };

  const chartData = [
    {
      name: 'Çalışma Memnuniyeti',
      ortalama: stats.averageWorkSatisfaction,
      maksimum: 5
    },
    {
      name: 'İmkânlar Memnuniyeti',
      ortalama: stats.averageFacilitiesSatisfaction,
      maksimum: 5
    },
    {
      name: 'Uzun Vadeli Niyet',
      ortalama: stats.averageLongTermIntent,
      maksimum: 5
    },
    {
      name: 'Tavsiye Etme',
      ortalama: stats.averageRecommendation,
      maksimum: 5
    },
    {
      name: 'Uygulama Memnuniyeti',
      ortalama: stats.averageApplicationSatisfaction,
      maksimum: 5
    }
  ];

  const satisfactionDistribution = () => {
    const distribution: { [key: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    cvList.forEach(cv => {
      if (cv.evaluation?.workSatisfaction) {
        distribution[cv.evaluation.workSatisfaction.toString()]++;
      }
    });

    return Object.entries(distribution).map(([rating, count]) => ({
      name: `${rating} Yıldız`,
      value: count,
      percentage: cvList.length > 0 ? ((count / cvList.length) * 100).toFixed(1) : 0
    }));
  };

  const pieData = satisfactionDistribution();
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  const exportReport = () => {
    const reportData = {
      tarih: new Date().toLocaleDateString('tr-TR'),
      toplamYanit: stats.totalResponses,
      ortalamalar: {
        calismaMemnuniyeti: stats.averageWorkSatisfaction,
        imkanlarMemnuniyeti: stats.averageFacilitiesSatisfaction,
        uzunVadeliNiyet: stats.averageLongTermIntent,
        tavsiyeEtme: stats.averageRecommendation,
        uygulamaMemnuniyeti: stats.averageApplicationSatisfaction
      },
      detayliVeriler: cvList.map(cv => ({
        adSoyad: `${cv.personalInfo?.firstName} ${cv.personalInfo?.lastName}`,
        email: cv.personalInfo?.email,
        calismaMemnuniyeti: cv.evaluation?.workSatisfaction || 0,
        imkanlarMemnuniyeti: cv.evaluation?.facilitiesSatisfaction || 0,
        uzunVadeliNiyet: cv.evaluation?.longTermIntent || 0,
        tavsiyeEtme: cv.evaluation?.recommendation || 0,
        uygulamaMemnuniyeti: cv.evaluation?.applicationSatisfaction || 0
      }))
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `degerlendirme_raporu_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 bg-white bg-opacity-95 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Değerlendirme Raporu</h1>
            <p className="mt-2 text-lg text-gray-600">
              Çalışan memnuniyet analizleri ve istatistikler
            </p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Raporu İndir
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Yanıt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ortalama Memnuniyet</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageWorkSatisfaction}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tavsiye Oranı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRecommendation}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uygulama Puanı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageApplicationSatisfaction}/5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bar Chart */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Kategori Bazında Ortalamalar</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ortalama" fill="#3b82f6" name="Ortalama Puan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Çalışma Memnuniyeti Dağılımı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: %${percentage}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detaylı Tablo */}
      <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Detaylı Değerlendirme Sonuçları</h2>
        
        {cvList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Henüz değerlendirme verisi bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çalışan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Çalışma Memnuniyeti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İmkânlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uzun Vadeli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tavsiye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uygulama
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cvList.map((cv) => (
                  <tr key={cv.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{cv.personalInfo?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (cv.evaluation?.workSatisfaction || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({cv.evaluation?.workSatisfaction || 0}/5)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (cv.evaluation?.facilitiesSatisfaction || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({cv.evaluation?.facilitiesSatisfaction || 0}/5)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (cv.evaluation?.longTermIntent || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({cv.evaluation?.longTermIntent || 0}/5)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (cv.evaluation?.recommendation || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({cv.evaluation?.recommendation || 0}/5)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (cv.evaluation?.applicationSatisfaction || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">({cv.evaluation?.applicationSatisfaction || 0}/5)</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationReport; 