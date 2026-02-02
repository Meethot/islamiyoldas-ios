import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Legal() {
    const { type } = useParams();
    const navigate = useNavigate();

    const content = {
        privacy: {
            title: "Gizlilik Politikası",
            body: `
                Ruhani Yol olarak gizliliğinize önem veriyoruz. 
                Bu uygulama tamamen kullanıcı dostu olup, kişisel verilerinizi toplamaz ve üçüncü şahıslarla paylaşmaz.
                Tüm verileriniz (Kaza namazları, hedefler vb.) sadece telefonunuzda saklanır.
                Uygulama silindiğinde bu veriler de silinebilir.
                Daha fazla bilgi için bizimle iletişime geçebilirsiniz.
            `
        },
        about: {
            title: "Hakkımızda",
            body: `
                Ruhani Yol, modern dünyaya manevi bir pencere açmak için tasarlandı.
                Amacımız, ibadetlerinizi daha düzenli takip etmenize yardımcı olmak, 
                zor anlarınızda manevi destek sunmak ve her gün yeni bir ilhamla güne başlamanızı sağlamaktır.
                
                "En hayırlınız, insanlara en faydalı olanınızdır." düsturuyla çıktığımız bu yolda, 
                sürekli gelişerek size en iyi deneyimi sunmaya çalışıyoruz.
            `
        }
    };

    const current = content[type] || content.about;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#032e18] animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#044d29]/40 backdrop-blur-md sticky top-0 z-10 p-4 flex items-center gap-4 border-b dark:border-white/5">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full dark:text-white">
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-serif font-bold text-islamic-green dark:text-islamic-gold">{current.title}</h1>
            </div>

            <div className="p-5">
                <article className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-line text-gray-700 dark:text-emerald-100/70 leading-relaxed font-serif text-lg italic">
                        {current.body}
                    </div>
                </article>

                <div className="mt-12 p-6 bg-islamic-green/5 dark:bg-white/5 rounded-[2rem] text-center">
                    <p className="text-xs text-islamic-green dark:text-islamic-gold font-bold">Ruhani Yol Ekibi</p>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Vakit Ayırdığınız İçin Teşekkürler</p>
                </div>
            </div>
        </div>
    );
}
