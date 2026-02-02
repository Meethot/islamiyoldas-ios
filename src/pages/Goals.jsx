import React from 'react';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Goals() {
    return (
        <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center space-y-6">
            <div className="w-24 h-24 bg-islamic-green/5 rounded-full flex items-center justify-center relative">
                <Target className="w-12 h-12 text-islamic-green/20" />
                <div className="absolute inset-0 border-2 border-dashed border-islamic-green/10 rounded-full animate-spin-slow" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-islamic-green">Henüz Hedef Yok</h2>
                <p className="text-gray-500 max-w-xs mx-auto">
                    Manevi yolculuğunuzda ilerlemek için ilk hedefinizi belirleyin.
                </p>
            </div>

            <Button className="bg-islamic-green hover:bg-islamic-green/90 text-white rounded-full px-8 h-12">
                <Plus className="mr-2 w-5 h-5" /> Yeni Hedef Ekle
            </Button>
        </div>
    );
}
