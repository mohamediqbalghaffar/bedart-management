'use client';

import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Home, 
  ShoppingCart, 
  Package, 
  Archive, 
  DollarSign, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'sales' | 'purchases' | 'stock' | 'expenses';

export default function TutorialPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'dashboard', label: 'داشبۆردی سەرەکی', icon: Home },
        { id: 'sales', label: 'فۆرمی فرۆشتن', icon: ShoppingCart },
        { id: 'purchases', label: 'پسوولەی کڕین', icon: Package },
        { id: 'stock', label: 'کۆگا و بەرهەمەکان', icon: Archive },
        { id: 'expenses', label: 'خەرجییە گشتییەکان', icon: DollarSign },
    ];

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-8 w-full max-w-full overflow-x-hidden" dir="rtl">
            <PageHeader 
                title="ڕێبەری بەکارهێنانی سیستەم" 
                description="فێرکاری و ڕوونکردنەوەی تەواو لەسەر بەشەکان و چۆنیەتی کارکردنی سیستەمی بەڕێوەبردنی بێدارت (BedArt)." 
            />

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <Button
                            key={tab.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "flex items-center gap-2 text-sm h-10 px-4",
                                isActive ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </Button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="w-full">
                {/* 1. Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <Card className="border-primary/20 bg-gradient-to-br from-blue-900/10 via-background to-indigo-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Home className="h-6 w-6 text-primary" />
                                    شیکاری و ئامارەکانی داشبۆرد
                                </CardTitle>
                                <CardDescription>لەم بەشەدا پوختەی هەموو داتاکانی کۆمپانیا لە ماوەیەکی دیاریکراودا پیشان دەدرێت.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-card border rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-primary">
                                            <Info className="h-4 w-4" />
                                            کارتەکانی ئاماری خێرا (KPIs)
                                        </h4>
                                        <p>ئەم کارتانە لە سەرەوەی داشبۆرد جێگیرکراون و چوار زانیاری گرنگ پیشان دەدەن:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2">
                                            <li><strong>کۆی داهاتی فرۆش:</strong> کۆی بەهای فۆرمەکانی فرۆشتن بەپێی بەرواری دیاریکراو.</li>
                                            <li><strong>کۆی خەرجییەکان:</strong> کۆی گشتی خەرجییە گشتییەکان + تێچووی پسوولەکانی کڕین.</li>
                                            <li><strong>بڕی کاڵای کەم لە کۆگا:</strong> ئەو کاڵایانەی کە بڕی ماوەیان لە نێوان ١ بۆ ٤ دانەیە.</li>
                                            <li><strong>قازانجی پوخت:</strong> هاوکێشەکە بریتییە لە: <em>(کۆی فرۆش - تێچووی کڕین - خەرجی گشتی)</em>.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-card border rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-primary">
                                            <TrendingUp className="h-4 w-4" />
                                            نەخشە و گرافیکە نوێیەکان
                                        </h4>
                                        <p>سیستەمەکە چوار جۆر گرافیکی شیکاری پێشکەوتوو پیشان دەدات بۆ تێگەیشتنی ئاسانتر:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2">
                                            <li><strong>نەخشەی چالاکییەکان:</strong> هێڵکاری ڕۆژانە یان کۆکراوەی فرۆشتن، خەرجی و قازانج.</li>
                                            <li><strong>شیکاری ڕێژەی قازانج:</strong> ڕێژەی سەدی قازانج لە هەر مانگێکدا و تێکڕای گشتی.</li>
                                            <li><strong>دابەشبوونی خەرجییەکان بە پۆل:</strong> دیاریکردنی زیاترین سەرچاوەی خەرجی (بۆ نموونە: کڕینی کاڵا، کرێ، مووچە).</li>
                                            <li><strong>بەراوردی فرۆشتن و خەرجی:</strong> پیشاندانی <strong>خاڵی سەربەخۆبوون (Break-Even Point)</strong> کە تێیدا داهات و خەرجی یەکسان دەبن و دەست بە قازانج دەکەیت.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">ئامۆژگاری بۆ فلتەرکردنی ماوە</h5>
                                        <p className="text-xs">تۆ دەتوانی لە ڕێگەی فلتەری سەرەوەی لاپەڕەکە، بەرواری دەستپێک و کۆتایی دیاری بکەیت بۆ ئەوەی هەموو گرافیکەکان و کارتەکان بەپێی ئەو ماوەیە نوێ ببنەوە. دوگمەی <strong>(هەموو ماوەکان)</strong> داتاکان لە ساڵی ٢٠١٨ـەوە تا ئەمڕۆ پیشان دەدات.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 2. Sales Tab */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        <Card className="border-primary/20 bg-gradient-to-br from-green-900/10 via-background to-emerald-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ShoppingCart className="h-6 w-6 text-emerald-500" />
                                    بەڕێوەبردنی فرۆشتنەکان و فۆرمی فرۆشتن
                                </CardTitle>
                                <CardDescription>تۆمارکردنی فرۆشتنی نوێ، داشکاندنەکان، و شێوازی وەرگرتنی پارە.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        هەنگاوەکانی تۆمارکردنی فۆرمی فرۆشتن
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2 pr-2">
                                        <li>سەردانی بەشی <strong>(فرۆشتنەکان)</strong> بکە و کلیک لەسەر دوگمەی <strong>(فۆرمی نوێ)</strong> بکە.</li>
                                        <li>زانیاری کڕیار (ناو، ژمارەی مۆبایل، ناونیشان) بنووسە. ئەگەر کڕیاری پێشوو بێت، سیستەمەکە پێشنیارت بۆ دەکات.</li>
                                        <li>لە بەشی بەرهەمەکان، ناوی کاڵاکە بنووسە یان کلیک لەسەر ئایکۆنی لیستەکە بکە بۆ هەڵبژاردنی کاڵا لە لیستی پێناسەکان یان کۆگا.</li>
                                        <li>بڕ (چەند دانە) و نرخی تاک دیاری بکە. بەشی داشکاندن ڕێژەی سەدی کەمکردنەوە لە نرخی کاڵاکە دیاری دەکات.</li>
                                        <li>پاشان دەتوانی پارەدانەکان لە ژێرەوە زیاد بکەیت (وەرگرتنی پێشەکی یان بەشێک لە پارەکە بە نەختینە یان حەواڵە).</li>
                                        <li>کلیک لەسەر <strong>(پاشەکەوتکردن)</strong> بکە بۆ جێگیرکردنی فۆرمەکە.</li>
                                    </ol>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-card border border-rose-500/20 rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-rose-500">
                                            <AlertTriangle className="h-4 w-4" />
                                            یاسای داشکاندن و دەسەڵاتەکان
                                        </h4>
                                        <p className="text-xs">سیستەمەکە ڕێگری دەکات لە پێدانی داشکاندنی نایاسایی بۆ پاراستنی بەرژەوەندی کۆمپانیا:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2 text-rose-400">
                                            <li>بەکارھێنەرانی ئاسایی (Salesman) ناتوانن لە <strong>١٠٪ زیاتر</strong> داشکاندن بۆ کاڵایەک بکەن.</li>
                                            <li>بەڕێوەبەر و ئەدمینەکان (Admin / Data Manager) دەتوانن تا <strong>١٠٠٪</strong> داشکاندن بکەن.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-card border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-emerald-500">
                                            <Archive className="h-4 w-4" />
                                            لێکدەرکردنی ئۆتۆماتیکی کۆگا
                                        </h4>
                                        <p className="text-xs">کاتێک فۆرمی فرۆشتن پاشەکەوت دەکەیت، سیستەمەکە ڕاستەوخۆ بە شێوەیەکی پارێزراو (Transaction-Safe):</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2 text-emerald-400">
                                            <li>بڕی فرۆشراو لە کۆگای دیاریکراو کەمدەکاتەوە.</li>
                                            <li>ئەگەر فۆرمەکە بسڕیتەوە یان هەموار بکەیتەوە، بڕی کۆن بۆ کۆگا دەگەڕێتەوە و بڕی نوێ کەم دەکرێتەوە.</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 3. Purchases Tab */}
                {activeTab === 'purchases' && (
                    <div className="space-y-6">
                        <Card className="border-primary/20 bg-gradient-to-br from-amber-900/10 via-background to-yellow-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Package className="h-6 w-6 text-amber-500" />
                                    پسوولەکانی کڕین (بۆردی بەرهەمەکان)
                                </CardTitle>
                                <CardDescription>تۆمارکردنی کڕین لە دابینکەران و هاوردەکردنی کاڵای نوێ بۆ کۆگا.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <p>بەشی پسوولەی کڕین بەکاردێت بۆ کڕینی بە کۆمەڵ لە دابینکەران. هەر فۆرمێکی کڕین ڕاستەوخۆ بڕی کاڵاکان لە کۆگا زیاد دەکات.</p>
                                    
                                    <h4 className="font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                        گرنگترین هەنگاوەکانی بەشی کڕین
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 pr-2 text-xs">
                                        <li><strong>دیاریکردنی دابینکەر:</strong> پێویستە پێش کڕین، دابینکەرەکە هەڵبژێریت یان زیادی بکەیت بۆ ئەوەی هاوسەنگی دارایی ڕوون بێت.</li>
                                        <li><strong>نرخی تێچوو (Purchase Price):</strong> نرخی کڕینی کاڵاکە بۆ داشبۆرد زۆر گرنگە بۆ حیسابکردنی قازانجی ڕاستەقینە.</li>
                                        <li><strong>زیادکردنی کۆگا:</strong> لە کاتی هەڵبژاردنی شوێن (مەخزەن یان پێشانگا)، بڕی کاڵاکان بە شێوەیەکی فەرمی زیاد دەکات.</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">ئاگاداری لە کاتی سڕینەوە</h5>
                                        <p className="text-xs">سڕینەوەی پسوولەی کڕین، بڕی کاڵاکان لە کۆگا کەم دەکاتەوە (کە پێشتر بەو پسوولەیە هاتبوونە ناوەوە). دڵنیابەرەوە لە بوونی بڕی پێویست لە کۆگا پێش سڕینەوەی کڕینەکان تاوەکو ڕێگری بکرێت لە تێکچوونی هاوسەنگی کۆگا.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 4. Stock Tab */}
                {activeTab === 'stock' && (
                    <div className="space-y-6">
                        <Card className="border-primary/20 bg-gradient-to-br from-purple-900/10 via-background to-pink-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Archive className="h-6 w-6 text-purple-500" />
                                    بەڕێوەبردنی کۆگا و ناو و پێناسی کاڵاکان
                                </CardTitle>
                                <CardDescription>بڕی بەردەست، شوێنی کاڵا، و هاوتاکردنی ناسنامەی بەرهەمەکان.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-card border rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-purple-500">
                                            <Archive className="h-4 w-4" />
                                            بەشی کۆگا (Stock)
                                        </h4>
                                        <p className="text-xs">لەم بەشەدا لیستی هەموو ئەو کاڵایانە دەبینیت کە ئێستا بڕیان هەیە لە کۆمپانیا. سیستەمەکە پشتگیری لە دوو شوێنی جیاواز دەکات:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2">
                                            <li><strong>Warehouse (کۆگا):</strong> شوێنی سەرەکی و تەیارکردنی کاڵاکان.</li>
                                            <li><strong>Showroom (پێشانگا):</strong> شوێنی نمایش و فرۆشتنی خێرا.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-card border rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-purple-500">
                                            <Settings className="h-4 w-4" />
                                            هاوتاکردنی داتاکان (Reconciliation)
                                        </h4>
                                        <p className="text-xs">لە لاپەڕەی <strong>(ڕێکخستنەکان)</strong>، ئامرازێکی گرنگ هەیە بە ناوی <strong>(ئامرازی هاوتاکردنی کۆگا)</strong>:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs pr-2 text-purple-400">
                                            <li>ئەم ئامرازە ناسنامەی (ID) کاڵاکان ڕێک دەخاتەوە بەپێی <em>ناو + قەبارە/مۆدێل + شوێنی کۆگا</em>.</li>
                                            <li>ئەگەر دوو کاڵا لە یەک کاتدا هەمان تایبەتمەندیان هەبێت، بڕەکانیان کۆدەکاتەوە بۆ ڕێگری لە دووبارەبوونەوە.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-card border rounded-xl p-4 space-y-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-purple-500">
                                        <FileText className="h-4 w-4" />
                                        ناوی کاڵاکان (Product Definitions)
                                    </h4>
                                    <p className="text-xs">لەم بەشەدا پێناسەی سەرەتایی بەرهەمەکان (ناوی کاڵا، جۆر، نرخی فرۆشتنی پێشنیارکراو، نرخی کڕین) تۆمار دەکرێت. ئەم تۆمارانە وەک پێشنیار (Autofill) کاردەکەن لە کاتی تۆمارکردنی پسوولەی نوێ، بەبێ ئەوەی کاریگەری لەسەر بڕی ڕاستەقینەی ناو کۆگا هەبێت تا کڕین یان فرۆشتن ئەنجام نەدرێت.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 5. Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="space-y-6">
                        <Card className="border-primary/20 bg-gradient-to-br from-rose-900/10 via-background to-pink-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <DollarSign className="h-6 w-6 text-rose-500" />
                                    تۆمارکردنی خەرجییە گشتییەکان
                                </CardTitle>
                                <CardDescription>تۆمارکردنی خەرجییە ڕۆژانەکان و کرێ و مووچە بە دراوە جیاوازەکان.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <p>خەرجییە گشتییەکان ڕۆڵێکی گرنگ دەبینن لە دەستنیشانکردنی تێچووی گشتی بازرگانییەکە. هەر خەرجییەک لەم بەشەدا تۆمار بکرێت، ڕاستەوخۆ قازانجی پوخت لە لاپەڕەی سەرەکی (داشبۆرد) کەمدەکاتەوە.</p>
                                    
                                    <h4 className="font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                        <CheckCircle2 className="h-4 w-4 text-rose-500" />
                                        تایبەتمەندی گۆڕینەوەی دراو و حیسابکردن
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 pr-2 text-xs">
                                        <li><strong>سەپاندنی دراوەکان:</strong> سیستەمەکە پشتگیری لە هەردوو دراوی <strong>دۆلاری ئەمریکی (USD)</strong> و <strong>دیناری عێراقی (IQD)</strong> دەکات.</li>
                                        <li><strong>تێچووی گۆڕینەوە:</strong> ئەگەر خەرجییەک بە دینار تۆمار بکرێت، سیستەمەکە بە شێوەیەکی ئۆتۆماتیکی بڕەکە دەگۆڕێت بۆ دۆلاری ئەمریکی بەپێی نرخی ئاڵوگۆڕی تۆمارکراو لە ڕێکخستنەکاندا، تاوەکو لە شیکارییە داراییەکاندا دژایەتی ڕوونەدات.</li>
                                        <li><strong>پۆلێنکردنی خەرجییەکان:</strong> گرنگە پۆلی خەرجییەکە بە دروستی دیاری بکرێت (بۆ نموونە: مووچە، کرێ، لۆجستی, ڕیکلام) تا لە گرافیکی دابەشبوونی تێچوودا بە دروستی پیشان بدرێت.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
