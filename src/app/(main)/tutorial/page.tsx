'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
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
  FileText,
  Users,
  Building,
  Printer,
  Search,
  FileSpreadsheet,
  ArrowRightLeft,
  ChevronLeft,
  EyeOff,
  Eye,
  RefreshCw,
  PlusCircle,
  FileDown,
  FileUp,
  Coins,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Save,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfidentialMode } from '@/contexts/confidential-mode-context';
import { ConfidentialBlur } from '@/components/shared/confidential-blur';

type TabType = 'dashboard' | 'sales' | 'purchases' | 'stock' | 'products' | 'customers' | 'suppliers' | 'expenses' | 'settings';

export default function TutorialPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const { isConfidential, toggleConfidentialMode } = useConfidentialMode();

    // Sales Mockup State
    const [salesQty, setSalesQty] = useState(2);
    const [salesDiscount, setSalesDiscount] = useState(5);
    const [salesRole, setSalesRole] = useState<'Salesman' | 'Admin'>('Salesman');
    
    // Purchases Mockup State
    const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [purchaseItems, setPurchaseItems] = useState<{name: string, qty: number, price: number}[]>([]);

    // Stock Mockup State
    const [warehouseQty, setWarehouseQty] = useState(12);
    const [showroomQty, setShowroomQty] = useState(3);
    const [transferAmount, setTransferAmount] = useState(2);
    const [transferError, setTransferError] = useState('');

    // Products Mockup State
    const [products, setProducts] = useState([
        { id: '1', name: 'دۆشەکی مێدیکاڵ', category: 'Mattress', price: 180, discount: 10 },
        { id: '2', name: 'تەختی دار شاهانە', category: 'Bed', price: 350, discount: 15 },
    ]);
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState(0);

    // Customers Mockup State
    const [showCustomerWarning, setShowCustomerWarning] = useState(false);

    // Expenses Mockup State
    const [localExpenses, setLocalExpenses] = useState([
        { id: 1, name: 'مووچەی کارمەندان', amount: 1200, currency: 'USD', category: 'Salary', date: '2026-06-15' },
        { id: 2, name: 'کرێی مانگانەی پێشانگا', amount: 750000, currency: 'IQD', category: 'Rent', date: '2026-06-12' },
    ]);
    const [newExpName, setNewExpName] = useState('');
    const [newExpAmount, setNewExpAmount] = useState('');
    const [newExpCurrency, setNewExpCurrency] = useState<'USD' | 'IQD'>('USD');
    const [newExpCategory, setNewExpCategory] = useState('Daily');

    // Settings Mockup State
    const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'users' | 'reconcile'>('general');

    // Reset mockup states on tab change
    useEffect(() => {
        setAiStatus('idle');
        setPurchaseItems([]);
        setTransferError('');
        setShowCustomerWarning(false);
    }, [activeTab]);

    const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
        { id: 'dashboard', label: 'داشبۆردی سەرەکی', icon: Home, color: 'text-blue-500' },
        { id: 'sales', label: 'بەشی فرۆشتنەکان', icon: ShoppingCart, color: 'text-emerald-500' },
        { id: 'purchases', label: 'بەشی کڕینەکان', icon: Package, color: 'text-amber-500' },
        { id: 'stock', label: 'بەشی کۆگا (شوێنەکان)', icon: Archive, color: 'text-purple-500' },
        { id: 'products', label: 'پێناسی کاڵاکان', icon: FileText, color: 'text-sky-500' },
        { id: 'customers', label: 'بەشی کڕیارەکان', icon: Users, color: 'text-pink-500' },
        { id: 'suppliers', label: 'بەشی دابینکەران', icon: Building, color: 'text-indigo-500' },
        { id: 'expenses', label: 'تۆمارکردنی خەرجی', icon: DollarSign, color: 'text-rose-500' },
        { id: 'settings', label: 'ڕێکخستنەکانی سیستەم', icon: Settings, color: 'text-slate-500' },
    ];

    // Simulated AI Purchase Excel Import
    const handleSimulatedAiImport = () => {
        setAiStatus('loading');
        setTimeout(() => {
            setPurchaseItems([
                { name: 'دۆشەکی ئۆرسۆپێدیک ١٢٠سم', qty: 10, price: 95 },
                { name: 'سەرینی گەش لایت', qty: 50, price: 8 },
                { name: 'بەرگی دۆشەک نەرم', qty: 25, price: 12 }
            ]);
            setAiStatus('success');
        }, 1500);
    };

    // Simulated Stock Transfer
    const handleStockTransfer = () => {
        setTransferError('');
        if (transferAmount <= 0) {
            setTransferError('بڕی گواستنەوە دەبێت لە سفر گەورەتر بێت.');
            return;
        }
        if (warehouseQty < transferAmount) {
            setTransferError('بڕی پێویست لە کۆگای سەرەکیدا نییە!');
            return;
        }
        setWarehouseQty(prev => prev - transferAmount);
        setShowroomQty(prev => prev + transferAmount);
    };

    // Simulated Expense Add
    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpName || !newExpAmount) return;
        const newObj = {
            id: Date.now(),
            name: newExpName,
            amount: parseFloat(newExpAmount),
            currency: newExpCurrency,
            category: newExpCategory,
            date: new Date().toISOString().split('T')[0]
        };
        setLocalExpenses([newObj, ...localExpenses]);
        setNewExpName('');
        setNewExpAmount('');
    };

    // USD/IQD Formatter
    const formatCurrency = (val: number, cur: string) => {
        if (cur === 'USD') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        } else {
            return new Intl.NumberFormat('en-US').format(val) + ' دینار';
        }
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-8 w-full max-w-full overflow-x-hidden" dir="rtl">
            <PageHeader 
                title="ڕێبەری بەکارهێنانی سیستەم" 
                description="لەم بەشەدا فێرکاری و ڕوونکردەوەی تەواو لەسەر بەش و تواناکانی سیستەمی بێدارت (BedArt) نیشان دراوە لەگەڵ نموونەی کارکردن لەسەر داتاکان." 
            />

            {/* Navigation Tabs - Horizontal scrolling on mobile, grid on desktop */}
            <div className="flex overflow-x-auto gap-2 border-b border-border pb-4 scrollbar-none snap-x snap-mandatory">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <Button
                            key={tab.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "flex items-center gap-2 text-sm h-10 px-4 flex-shrink-0 snap-start transition-all duration-300",
                                isActive 
                                    ? "bg-primary text-primary-foreground font-semibold shadow-md border-primary scale-105" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className={cn("h-4 w-4", tab.color)} />
                            <span>{tab.label}</span>
                        </Button>
                    );
                })}
            </div>

            {/* Split Screen Content: Right Side (Kurdish Guides) & Left Side (Interactive Mockup) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 xl:gap-8 items-start">
                
                {/* ── 1. INSTRUCTIONS PANEL (60% Width) ── */}
                <div className="xl:col-span-3 space-y-6">
                    
                    {/* 1. Dashboard Tab Guide */}
                    {activeTab === 'dashboard' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-blue-950/10 via-background to-indigo-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Home className="h-6 w-6 text-blue-500" />
                                    شیکاری و ئامارەکانی داشبۆرد
                                </CardTitle>
                                <CardDescription>لەم لاپەڕەیەدا کورتەی ڕەوشی دارایی و جوڵەی کاڵاکانی کۆمپانیا بە گرافیک نیشان دەدرێت.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-blue-400">
                                        <Info className="h-4 w-4" />
                                        کارتەکانی پێوەری گشتی (KPIs)
                                    </h4>
                                    <p>چوار کارتی جێگیرکراو لە سەرەوەی داشبۆرد بۆ دەرخستنی بارودۆخی دارایی:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li><strong className="text-foreground">کۆی داهاتی فرۆش:</strong> کۆی بەهای سەرجەم ئەو فرۆشتنانەی کە لە ماوەی دیاریکراودا پاشەکەوت کراون.</li>
                                        <li><strong className="text-foreground">کۆی خەرجییەکان:</strong> کۆکراوەی تێچووی پسوولەکانی کڕینی کاڵاکان لەگەڵ خەرجییە گشتییەکان.</li>
                                        <li><strong className="text-foreground">کاڵای کەم لە کۆگا:</strong> هۆشداریدانی خێرا بۆ ئەو بەرهەمانەی کە کەمتر لە ٥ دانەیان لە کۆگا ماوەتەوە بۆ ئەوەی ڕێگری بکرێت لە سفر بوونەوەی بڕەکە.</li>
                                        <li><strong className="text-foreground">قازانجی پوخت:</strong> ئەنجامی سەرەکی بازرگانییەکە کە لە ڕێگەی هاوکێشەی: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">(کۆی فرۆش - تێچووی کڕین - خەرجی گشتی)</code> ئەژمار دەکرێت.</li>
                                    </ul>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-blue-400">
                                        <TrendingUp className="h-4 w-4" />
                                        هێڵکارییە پێشکەوتووەکانی شیکاری داتا
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li><strong className="text-foreground">نەخشەی چالاکییەکان (Activity Chart):</strong> پیشاندانی ڕۆژانە یان مانگانەی کۆی فرۆش، خەرجی و قازانج بەیەکەوە.</li>
                                        <li><strong className="text-foreground">شیکاری ڕێژەی قازانج (Profit Margin Trend):</strong> پیشاندانی ڕێژەی سەدی قازانجی ڕاستەقینە بۆ هەر دۆلارێکی داهات لەسەر ئاستی مانگانە.</li>
                                        <li><strong className="text-foreground">دابەشبوونی خەرجییەکان (Cost Breakdown):</strong> هێڵکارییەکی بازنەیی کە بە ڕێژەی سەدی جۆری خەرجییە گشتییەکان (کرێ، مووچە، لۆجستی) پیشان دەدات.</li>
                                        <li><strong className="text-foreground">فرۆشتن بەرامبەر تێچوو (Sales vs Cost):</strong> دیاریکردنی <strong>خاڵی سەربەخۆبوون (Break-Even Point)</strong> کە پێمان دەڵێت لە چ ئاستێکدا خەرجی و داهات یەکسان دەبن و قازانج دەست پێدەکات.</li>
                                    </ul>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start mt-4">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">ئامۆژگاری فلتەری بەروار</h5>
                                        <p className="text-xs text-muted-foreground">تۆ دەتوانیت لە بەشی سەرەوەی داشبۆرد بەرواری دەستپێک و کۆتایی دیاری بکەیت تا هەموو ئامار و گرافیکەکان تەنها بۆ ئەو ماوەیە دابڕێژرێنەوە. دوگمەی <strong>(هەموو ماوەکان)</strong> داتاکان لە ٢٠١٨ـەوە تا ئەمڕۆ لێکدەداتەوە.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 2. Sales Tab Guide */}
                    {activeTab === 'sales' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-emerald-950/10 via-background to-green-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ShoppingCart className="h-6 w-6 text-emerald-500" />
                                    بەڕێوەبردنی فرۆشتنەکان و فۆرمی نوێ
                                </CardTitle>
                                <CardDescription>تۆمارکردنی فرۆشتن لەگەڵ دیاریکردنی شوێنی کۆگا، داشکاندن، و خشتەی قیستەکان.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ڕێکاری تۆمارکردنی فۆرمی فرۆشتن
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2 pr-2 text-xs text-muted-foreground">
                                        <li>کلیک لەسەر دوگمەی <strong className="text-foreground">فۆڕمی فرۆشتنی نوێ</strong> بکە.</li>
                                        <li>زانیاری کڕیار (ناو، مۆبایل، ناونیشان) پڕبکەرەوە. ئەگەر پێشتر کڕیاری تۆمارکراو بێت، لە کاتی نووسیندا ناوی پێشنیار دەکرێت.</li>
                                        <li>لە خشتەی کاڵاکان، ناوی بەرهەم هەڵبژێرە، بڕەکەی دیاری بکە، پاشان شوێنی دەرکردنی کاڵاکە دیاری بکە (کۆگا یان پێشانگا).</li>
                                        <li>نرخەکە و بڕی داشکاندنی هەر هێڵێک بنووسە. داشکاندنەکان لەلایەن سیستەمەکەوە سنووردار کراون بۆ سەلامەتی داهات.</li>
                                        <li>لە بەشی خوارەوە دەتوانیت بڕی دراو بە شێوەی پێشەکی، قیست یان حەواڵە بنووسیت. بڕی ماوە بە قەرز لەسەر کڕیارەکە هەژمار دەکرێت.</li>
                                        <li>دوگمەی <strong className="text-foreground">پاشەکەوتکردن</strong> لێ بدە تا جوڵەکە بچێتە داتابەیس و کۆگا کەم بکرێتەوە.</li>
                                    </ol>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-rose-500 text-xs">
                                            <AlertTriangle className="h-4 w-4" />
                                            سیاسەتی داشکاندن بەپێی ڕۆڵەکان
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">سەرجەم بەکارهێنەران ناتوانن بە ئارەزووی خۆیان داشکاندن بکەن:</p>
                                        <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-400 pr-2">
                                            <li>بەکارھێنەری ئاسایی (Salesman): تەنها تا <strong>١٠٪</strong> ڕێگەی پێدەدریت.</li>
                                            <li>بەڕێوەبەر یان داتا مانجەر (Admin): دەسەڵاتی تا <strong>١٠٠٪</strong> هەیە.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-emerald-500 text-xs">
                                            <Archive className="h-4 w-4" />
                                            لێکدەرکردنی سەلامەت لە کۆگا
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">کاتێک فۆڕمی فرۆشتن پاشەکەوت دەکرێت:</p>
                                        <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-400 pr-2">
                                            <li>بڕی فرۆشراو لە ژینگەیەکی پارێزراودا (Firestore Transaction) لەو شوێنە (کۆگا/پێشانگا) کەمدەبێتەوە.</li>
                                            <li>سڕینەوە یان دەستکاریکردنی فۆرمەکە، بڕی کۆن بە تەواوی دەگەڕێنێتەوە کۆگا.</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 3. Purchases Tab Guide */}
                    {activeTab === 'purchases' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-amber-950/10 via-background to-yellow-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Package className="h-6 w-6 text-amber-500" />
                                    تۆمارکردنی پسوولەی کڕین (سەرچاوەی کۆگا)
                                </CardTitle>
                                <CardDescription>تۆمارکردنی هاوردەکردنی کاڵاکان بە کۆمەڵ لە دابینکەرەکانەوە بۆ ناو کۆگاکانی کۆمپانیا.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <p>لاپەڕەی کڕینەکان بەکاردێت بۆ بەرزکردنەوەی بڕی کۆگای سەرەکی یان پێشانگا لە کاتی کڕینی کاڵای نوێ لە دابینکەرەکان. هەر کڕینێک هاوسەنگی کۆگا زیاد دەکات.</p>
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-amber-400">
                                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                        تایبەتمەندی تێچووی زیادە و گومرگ (Customs Fee)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">لە کاتی دروستکردنی پسوولەی کڕین، دەتوانیت تێچووی زیاتر وەک کرێی گومرگ، گواستنەوە یان بارهەڵگر بنووسیت. سیستەمەکە بە شێوەیەکی ئۆتۆماتیکی ئەم تێچووانە بەسەر بەهای هەر کاڵایەکدا دابەش دەکات بۆ دیاریکردنی <strong>نرخی تێچووی پوخت (True Cost Price)</strong>، کە دواتر لە داشبۆرد بۆ هەژمارکردنی قازانجی ڕاستەقینە بەکاردێت.</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-amber-400">
                                        <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                                        هاوردەکردنی زیرەکی پسوولەی ئەکسەل بە AI
                                    </h4>
                                    <p className="text-xs text-muted-foreground">ئەگەر پسوولەی کڕینەکەت لە فایلی ئەکسەلدا بێت و شێوازەکەی لەگەڵ سیستەمەکە یەک نەگرێتەوە:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li>کلیک لەسەر دوگمەی <strong className="text-foreground">هاوردەکردنی فایلی ئەکسەل بە AI</strong> بکە.</li>
                                        <li>سیستەمەکە فایلەکە دەنێرێت بۆ بەشی زیرەکی دەستکرد، AI بە تەواوی ناوی کاڵاکان، نرخ، بڕ، و جۆری کاڵاکان دەخوێنێتەوە و هاوتا دەکات لەگەڵ پێناسەکانی ئێستاتدا.</li>
                                        <li>دوای تەواوبوون، زانیارییەکان ڕاستەوخۆ دەخرێنە ناو فۆرمەکەوە بۆ پێداچوونەوە و پاشەکەوتکردن.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 4. Stock Tab Guide */}
                    {activeTab === 'stock' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-purple-950/10 via-background to-pink-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Archive className="h-6 w-6 text-purple-500" />
                                    بەشی کۆگا و گواستنەوەی کاڵا
                                </CardTitle>
                                <CardDescription>پیشاندانی بڕی بەردەستی کاڵاکان بەپێی شوێنەکانیان و جوڵەی کاڵاکان لە نێوانیاندا.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-purple-400">
                                        <Archive className="h-4 w-4" />
                                        جیاوازی شوێنی کۆگاکان
                                    </h4>
                                    <p className="text-xs text-muted-foreground">سیستەمی بێدارت پشتگیری لە کۆکردنەوەی بڕی کاڵاکان دەکات لە دوو شوێنی فیزیایی جیاوازدا:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li><strong className="text-foreground">Warehouse (کۆگای سەرەکی):</strong> بەکاردێت وەک شوێنی سەرەکی هەڵگرتنی بارە گەورەکان و وەرگرتنی کڕینەکان.</li>
                                        <li><strong className="text-foreground">Shop Showroom (پێشانگای فرۆشتن):</strong> شوێنی نمایشکردن و فرۆشتنی ڕۆژانەی کاڵاکانە.</li>
                                    </ul>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-purple-400">
                                        <ArrowRightLeft className="h-4 w-4" />
                                        گواستنەوەی نێوان کۆگاکان (Stock Transfer)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">لە کاتی ناردنی بەرهەمەکان لە کۆگای سەرەکییەوە بۆ پێشانگا یان بەپێچەوانەوە، پێویستە ئامرازی <strong>گواستنەوەی کاڵا</strong> بەکاربهێنرێت. ئەم کردارە بڕی شوێنی یەکەم کەم دەکاتەوە و شوێنی دووەم زیاد دەکات لە یەک کاتی پارێزراودا (Firestore Transaction) بەبێ ئەوەی کاریگەری بکاتە سەر کۆی گشتی بەهای دارایی کاڵاکان.</p>
                                </div>

                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex gap-3 items-start mt-4">
                                    <Info className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">فلتەری کاڵا تەواوبووەکان (Depleted Stock)</h5>
                                        <p className="text-xs text-muted-foreground">سویچی "پیشاندانی کاڵا تەواوبووەکان" بەکاربهێنە بۆ بینینی ئەو بەرهەمانەی کە بڕیان گەیشتووەتە صفر لە هەردوو شوێنەکەدا بۆ ئەوەی بڕیاری کڕینی نوێیان لەسەر بدەیت.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 5. Products Tab Guide */}
                    {activeTab === 'products' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-sky-950/10 via-background to-blue-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-sky-500" />
                                    پێناسەی کاڵاکان (Product Definitions)
                                </CardTitle>
                                <CardDescription>تۆمارکردن و ناساندنی جۆرەکانی کاڵا بەبێ بڕ، بۆ ڕێکخستنی کارئاسانی لە کاتی فرۆشتن و کڕیندا.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <p>ئەم بەشە بریتییە لە <strong>ناسنامەی کاڵاکان</strong>. کاتێک بەرهەمێکی نوێ لێرە تۆمار دەکەیت، بڕەکەی لە کۆگادا بە سفر تۆمار دەکرێت تا ئەو کاتەی پسوولەیەکی کڕینی بۆ دروست دەکەیت.</p>
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-sky-400">
                                        <CheckCircle2 className="h-4 w-4 text-sky-500" />
                                        گرنگترین سوودەکانی پێناسەی کاڵا
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li>زانیارییە سەرەتاییەکان (وەک پۆل، نرخی فرۆشتنی پێشنیارکراو، و سنوری داشکاندنی یاسایی) پێناسە دەکات.</li>
                                        <li>لە کاتی دروستکردنی فۆڕمی فرۆشتن یان کڕین، تەنها بە نووسینی یەکەم پیت، زانیارییەکان بە شێوەی ئۆتۆماتیکی پڕدەبنەوە (Autofill).</li>
                                    </ul>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-sky-400">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        کردارە بەکۆمەڵەکان (Bulk Management)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">بۆ بارکردنی سەدان کاڵا بە یەکجار و بەبێ تۆمارکردنی تاکەکەسی:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li>دوگمەی <strong>دابەزاندنی فایلی نموونەی ئەکسەل</strong> دابەزێنە.</li>
                                        <li>سەرجەم ناو و نرخەکانت لە فۆرماتی دیاریکراودا بنووسە.</li>
                                        <li>فایلەکە لە ڕێگەی دوگمەی <strong>بارکردنی فایل (Upload Excel)</strong> بنێرە، سیستەمەکە ڕاستەوخۆ هەموو کاڵا نوێیەکان تۆمار دەکات و ڕێگری لە تۆمارکردنی کاڵای دووبارە دەکات.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 6. Customers Tab Guide */}
                    {activeTab === 'customers' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-pink-950/10 via-background to-rose-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="h-6 w-6 text-pink-500" />
                                    بەڕێوەبردنی زانیاری کڕیارەکان (CRM)
                                </CardTitle>
                                <CardDescription>تۆمارکردن، هەموارکردن و پاراستنی مافی دارایی و ژمارەی پەیوەندی کڕیاران.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-pink-400">
                                        <Info className="h-4 w-4" />
                                        تایبەتمەندی کڕیاران و شوێنکەوتنی قەرز
                                    </h4>
                                    <p className="text-xs text-muted-foreground">تۆمارکردنی کڕیاران یارمەتیدەر دەبێت لە بەرزکردنەوەی متمانەی بازرگانی و ڕوونبوونەوەی حسابی قیستەکان:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li>دەتوانیت ناو، ژمارەی مۆبایل، و ناونیشانی کڕیار تۆمار بکەیت.</li>
                                        <li>ڕێگەت پێدەدات مێژووی فرۆشتنەکان و بڕی قەرزی ماوەی هەموو کڕیارێک بەوردی بزانیت.</li>
                                    </ul>
                                </div>

                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start mt-4">
                                    <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">ئامۆژگاری پاراستنی هاوسەنگی (Referential Integrity)</h5>
                                        <p className="text-xs text-rose-400">بۆ ئەوەی مێژووی دارایی کۆمپانیا تێکنەچێت، <strong>سیستەمەکە ڕێگری تەواو دەکات لە سڕینەوەی هەر کڕیارێک کە فۆڕمێکی فرۆشتنی بە ناوەوە بێت</strong>. ئەگەر هەوڵی سڕینەوەی بدەیت، ئاگادارکردنەوەی سوور پیشان دەدات و کردارەکە ڕادەگرێت تاوەکو سەرجەم فرۆشتنەکانی ناو فۆڕمەکە پاکتاو نەکرێن.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 7. Suppliers Tab Guide */}
                    {activeTab === 'suppliers' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-indigo-950/10 via-background to-violet-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Building className="h-6 w-6 text-indigo-500" />
                                    تۆماری دابینکەران (Suppliers)
                                </CardTitle>
                                <CardDescription>تۆمارکردنی بازرگان و کارگەکانی سەرچاوەی سەرەکی کاڵاکانی کۆمپانیا.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-indigo-400">
                                        <Info className="h-4 w-4" />
                                        گرنگی بەستنەوەی دابینکەر بە کڕینەوە
                                    </h4>
                                    <p className="text-xs text-muted-foreground">هەموو پسوولەیەکی کڕین دەبێت بە دابینکەرێکی فەرمی ببەسرێتەوە:</p>
                                    <ul className="list-disc list-inside space-y-2 pr-4 text-xs text-muted-foreground">
                                        <li>ئەم تێکەڵکردنە ڕێگەخۆشکەر دەبێت تا بزانیت چ بڕە پارەیەک بە کڕینی کاڵا بە دابینکەر دراوە.</li>
                                        <li>یارمەتیدەر دەبێت بۆ ڕاپۆرتی حساباتی قەرزی سەر دابینکەران.</li>
                                    </ul>
                                </div>

                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start mt-4">
                                    <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="font-semibold text-foreground mb-1">یاسای پاراستنی پسوولەکانی کڕین</h5>
                                        <p className="text-xs text-rose-400">هاوشێوەی کڕیاران، <strong>ڕێگری دەکرێت لە سڕینەوەی هەر دابینکەرێک ئەگەر پسوولەیەکی کڕینی بە ناوەوە تۆمار کرابێت</strong>. ئەم بەستنەوەیە پارێزگاری لە متمانەی جووڵەی داتاکانی کۆمپانیا دەکات.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 8. Expenses Tab Guide */}
                    {activeTab === 'expenses' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-rose-950/10 via-background to-pink-950/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <DollarSign className="h-6 w-6 text-rose-500" />
                                    تۆماری خەرجییە گشتییەکان (Operational Expenses)
                                </CardTitle>
                                <CardDescription>پۆلێنکردنی تێچووەکانی بەڕێوەبردنی بازرگانی لەگەڵ پاڵپشتی ئاڵوگۆڕی دراوی نەختینە.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="space-y-4">
                                    <p>تۆمارکردنی خەرجییەکان زۆر گرنگە بۆ داشبۆردی سەرەکی تا بتوانێت قازانجی پوختی کۆمپانیا بە دروستی ئەژمار بکات.</p>
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-rose-400">
                                        <Coins className="h-4 w-4 text-yellow-500" />
                                        ئاڵوگۆڕی ئۆتۆماتیکی دینار بۆ دۆلار (USD / IQD)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">سیستەمی بێدارت پشتگیری لە هەردوو دراو دەکات. ئەگەر خەرجییەک بە <strong>دیناری عێراقی</strong> بنووسیت، سیستەمەکە بە شێوەیەکی ئۆتۆماتیکی بڕەکە دەکاتە دۆلار بەپێی <strong>نرخی گۆڕینەوەی دراو (Exchange Rate)</strong> کە لە ڕێکخستنەکان جێگیرکراوە، ئەمەش بۆ ئەوەی سەرجەم ژمارەکانی نێو داشبۆرد بە یەک جۆر دراو (دۆلار) پیشان بدرێت.</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-rose-400">
                                        <PlusCircle className="h-4 w-4" />
                                        تۆمارکردنی خێرا لە خشتەکەدا (Inline Table Add)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">بۆ بەرزکردنەوەی خێرایی کارکردنی کارمەند، لەم بەشەدا خشتەی خەرجییەکان ڕاستەوخۆ لە ڕیزی سەرەوەیدا (ژێر هێدەرەکە) فۆڕمێکی جێگیرکراوی هەیە. بەبێ ناردنی بەکارهێنەر بۆ لاپەڕەیەکی تر یان کردنەوەی پۆپ ئەپ، کارمەند دەتوانێت ناوی خەرجی، بڕ، دراو و پۆلەکەی دیاری بکات و بە لێدانی دوگمەی <strong>شێوەی سەوز یان ئینتەر</strong> تۆماری بکات.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 9. Settings Tab Guide */}
                    {activeTab === 'settings' && (
                        <Card className="border-primary/20 bg-gradient-to-br from-slate-900/10 via-background to-zinc-900/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Settings className="h-6 w-6 text-slate-500" />
                                    ڕێکخستنەکانی سیستەم و ئامرازەکان
                                </CardTitle>
                                <CardDescription>بەڕێوەبردنی کارمەندان، زانیاری کۆمپانیا، بەهێزکردنی کۆگا، و هاوردەکردنی داتا بە AI.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-sm text-foreground/80 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-card border rounded-lg p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-slate-400 text-xs">
                                            <EyeOff className="h-4 w-4" />
                                            دۆخی شاردنەوە (Confidential Mode)
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">سویچێکە لە بەشی گشتی کە چالاککردنی سەرجەم نرخ و ژمارە هەستیارەکانی داهات و قازانج دەستبەجێ لێڵ (Blur) دەکات بۆ پاراستنی نهێنییەکان لە کاتی پیشاندانی پرۆگرامەکە بە خەڵک.</p>
                                    </div>
                                    <div className="bg-card border rounded-lg p-4 space-y-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 text-slate-400 text-xs">
                                            <RefreshCw className="h-4 w-4" />
                                            هاوتاکردنی کۆگا (Reconciliation)
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">ئامرازێکە کە بە بەکارهێنانی کلیلەکانی <code>ناو + قەبارە + شوێن</code> پشکنین بۆ کۆگا دەکات. ئەگەر کاڵایەکی جیاواز لە داتابەیس هەمان تایبەتمەندی هەبێت، بڕەکانیان لە یەک ناسنامەدا کۆدەکاتەوە تا ڕێگری لە پەرتبوونی پێناسەکان بکات.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-slate-400">
                                        <Users className="h-4 w-4" />
                                        بەڕێوەبردنی بەکارهێنەران و دەسەڵاتەکان
                                    </h4>
                                    <p className="text-xs text-muted-foreground">ئەدمین دەتوانێت فۆڕمی زیادکردنی بەکارهێنەران بەکاربهێنێت بۆ تۆمارکردنی کارمەند نوێ، دیاریکردنی وێنە و ناو، لەگەڵ پۆلێنکردنی ڕۆڵەکانیان:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground pr-4">
                                        <li><strong>Admin:</strong> کۆنتڕۆڵی تەواوی سیستەم، سڕینەوە، دەستکاری زانیارییەکان.</li>
                                        <li><strong>Data Manager:</strong> کارئاسانی لە تۆماری کاڵاکان، بەڵام توانای سڕینەوەی گرنگی دارایی نییە.</li>
                                        <li><strong>Salesman:</strong> تەنها دەتوانێت فۆڕمی فرۆشتن دروست بکات، بە بڕی داشکاندنی دیاریکراو (تا ١٠٪).</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* ── 2. INTERACTIVE VISUAL MOCKUP PANEL (40% Width) ── */}
                <div className="xl:col-span-2 space-y-4 sticky top-6">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                            نموونەی کارکردنی ڕاستەقینە
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">دۆخی شاردنەوە:</span>
                            <Switch 
                                checked={isConfidential} 
                                onCheckedChange={toggleConfidentialMode} 
                                aria-label="Toggle Confidential Mode"
                            />
                        </div>
                    </div>

                    {/* MOCKUP: Dashboard */}
                    {activeTab === 'dashboard' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>داشبۆردی سەرەکی (پیشاندان)</span>
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400">چالاکە</Badge>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                {/* Simulated KPI Cards */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 hover:scale-105 transition-transform duration-300">
                                        <div className="text-[10px] text-emerald-400 font-semibold mb-1">داهاتی فرۆش</div>
                                        <div className="text-sm font-bold text-emerald-500">
                                            <ConfidentialBlur>$15,450.00</ConfidentialBlur>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 p-3 rounded-xl border border-rose-500/20 hover:scale-105 transition-transform duration-300">
                                        <div className="text-[10px] text-rose-400 font-semibold mb-1">کۆی خەرجییەکان</div>
                                        <div className="text-sm font-bold text-rose-500">
                                            <ConfidentialBlur>$4,120.00</ConfidentialBlur>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 p-3 rounded-xl border border-blue-500/20 hover:scale-105 transition-transform duration-300 col-span-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-[10px] text-blue-400 font-semibold mb-1">قازانجی پوخت</div>
                                                <div className="text-base font-bold text-blue-500">
                                                    <ConfidentialBlur>$11,330.00</ConfidentialBlur>
                                                </div>
                                            </div>
                                            <TrendingUp className="h-5 w-5 text-blue-500 animate-bounce" />
                                        </div>
                                    </div>
                                </div>

                                {/* Simulated Graph Bar Chart */}
                                <div className="bg-muted/20 p-4 border rounded-xl space-y-4">
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                        <span>ئاستی چالاکی فرۆش (٥ مانگی ڕابردوو)</span>
                                        <span className="font-semibold text-primary">قازانج</span>
                                    </div>
                                    <div className="h-28 flex items-end justify-between gap-2 px-2 pt-2 border-b relative">
                                        {/* Break-Even Reference Line */}
                                        <div className="absolute top-[40%] left-0 w-full border-t border-dashed border-rose-500/40 z-0 flex justify-end">
                                            <span className="text-[7px] text-rose-400 bg-card px-1 -mt-1.5 ml-2 font-mono">BEP</span>
                                        </div>

                                        <div className="w-full flex flex-col items-center gap-1 z-10 group">
                                            <div className="w-full bg-emerald-500/30 group-hover:bg-emerald-500/50 rounded-t h-12 transition-all duration-500 flex items-end justify-center">
                                                <div className="w-full bg-emerald-500 rounded-t h-8"></div>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-mono">مانگی ٢</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center gap-1 z-10 group">
                                            <div className="w-full bg-emerald-500/30 group-hover:bg-emerald-500/50 rounded-t h-16 transition-all duration-500 flex items-end justify-center">
                                                <div className="w-full bg-emerald-500 rounded-t h-11"></div>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-mono">مانگی ٣</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center gap-1 z-10 group">
                                            <div className="w-full bg-emerald-500/30 group-hover:bg-emerald-500/50 rounded-t h-20 transition-all duration-500 flex items-end justify-center">
                                                <div className="w-full bg-emerald-500 rounded-t h-15"></div>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-mono">مانگی ٤</span>
                                        </div>
                                        <div className="w-full flex flex-col items-center gap-1 z-10 group">
                                            <div className="w-full bg-rose-500/20 group-hover:bg-rose-500/40 rounded-t h-8 transition-all duration-500 flex items-end justify-center">
                                                <div className="w-full bg-rose-500 rounded-t h-3"></div>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-mono">مانگی ٥</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground text-center">مانگی ٥ بەهۆی زۆری تێچووی کڕین و خەرجی خوار خاڵی سەربەخۆبوون (BEP) کەوتووە.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Sales */}
                    {activeTab === 'sales' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>فۆڕمی فرۆشتنی نوێ</span>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSalesRole('Salesman')} 
                                        className={cn("h-5 text-[8px] px-1.5", salesRole === 'Salesman' && "bg-rose-500/10 text-rose-500")}
                                    >
                                        Salesman
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSalesRole('Admin')} 
                                        className={cn("h-5 text-[8px] px-1.5", salesRole === 'Admin' && "bg-emerald-500/10 text-emerald-500")}
                                    >
                                        Admin
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px]">کڕیار: کۆسار سلێمانی</Label>
                                    <div className="p-3 bg-muted/20 border rounded-xl space-y-2 text-xs">
                                        <div className="flex justify-between font-semibold">
                                            <span>ناوی کاڵا</span>
                                            <span>بڕ</span>
                                            <span>نرخ</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground text-[11px] items-center">
                                            <span>دۆشەکی مێدیکاڵ</span>
                                            <div className="flex items-center gap-1.5">
                                                <Button size="icon" className="h-4 w-4 text-[10px] rounded-full" onClick={() => setSalesQty(q => Math.max(1, q - 1))}>-</Button>
                                                <span className="w-3 text-center">{salesQty}</span>
                                                <Button size="icon" className="h-4 w-4 text-[10px] rounded-full" onClick={() => setSalesQty(q => q + 1)}>+</Button>
                                            </div>
                                            <span>$180</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Discount warning */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span>داشکاندن (ڕێژەی سەدی)</span>
                                        <span className="font-mono text-primary">{salesDiscount}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={salesRole === 'Salesman' ? '20' : '100'} 
                                        value={salesDiscount} 
                                        onChange={(e) => setSalesDiscount(parseInt(e.target.value))}
                                        className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                                    />
                                    {salesRole === 'Salesman' && salesDiscount > 10 ? (
                                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[9px] flex items-center gap-1.5 animate-pulse">
                                            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>هەڵە! بۆ دەسەڵاتی Salesman لە ١٠٪ زیاتر ڕێگەپێنەدراوە.</span>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[9px] flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>سنوری داشکاندن گونجاوە بۆ ئەم ڕۆڵە.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-3 flex justify-between items-center text-xs">
                                    <span className="font-semibold">کۆی گشتی:</span>
                                    <span className="font-bold text-primary">
                                        <ConfidentialBlur>
                                            ${(salesQty * 180 * (1 - salesDiscount / 100)).toFixed(2)}
                                        </ConfidentialBlur>
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Purchases */}
                    {activeTab === 'purchases' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>پسوولەی کڕین (نموونە)</span>
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500">هاوردەکردنی ئەکسەل</Badge>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="text-[10px] text-muted-foreground mb-1">دابینکەر: کۆمپانیای لایت بەرهەم</div>
                                    
                                    {aiStatus === 'idle' && (
                                        <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10">
                                            <FileSpreadsheet className="h-8 w-8 text-amber-500/50" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold">فایلی ئەکسەلی دابینکەر هەیە؟</p>
                                                <p className="text-[10px] text-muted-foreground">بۆ پڕکردنەوەی خێرا بە زیرەکی دەستکرد</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] gap-1 px-3 h-8 shadow"
                                                onClick={handleSimulatedAiImport}
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                هاوردەکردن بە AI
                                            </Button>
                                        </div>
                                    )}

                                    {aiStatus === 'loading' && (
                                        <div className="border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10">
                                            <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                                            <p className="text-xs text-amber-400 font-semibold animate-pulse">...AI سەرقاڵی شیکردنەوەی فایلەکەیە</p>
                                        </div>
                                    )}

                                    {aiStatus === 'success' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> کاڵاکان بە سەرکەوتوویی خوێندرانەوە
                                                </span>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" onClick={() => setAiStatus('idle')}>
                                                    <RefreshCw className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="max-h-[120px] overflow-y-auto border rounded-xl p-2 space-y-1.5 bg-muted/10">
                                                {purchaseItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-[10px] border-b pb-1 last:border-0 last:pb-0">
                                                        <span className="font-semibold text-foreground/80 truncate max-w-[120px]">{item.name}</span>
                                                        <span className="text-muted-foreground font-mono">{item.qty}دانە × ${item.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground p-1 border rounded-lg bg-card flex justify-between font-semibold">
                                                <span>کۆی گشتی بەهای کڕین:</span>
                                                <span className="text-primary font-bold"><ConfidentialBlur>$1,550.00</ConfidentialBlur></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Stock */}
                    {activeTab === 'stock' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>گواستنەوە و کۆنترۆڵکردنی کۆگا</span>
                                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400">کۆگا دۆشەک</Badge>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 border rounded-xl text-center bg-muted/20">
                                        <div className="text-[10px] text-muted-foreground">کۆگای سەرەکی (Warehouse)</div>
                                        <div className="text-xl font-bold font-mono text-primary mt-1">{warehouseQty}</div>
                                    </div>
                                    <div className="p-3 border rounded-xl text-center bg-muted/20">
                                        <div className="text-[10px] text-muted-foreground">پێشانگا (Shop Showroom)</div>
                                        <div className="text-xl font-bold font-mono text-purple-500 mt-1">{showroomQty}</div>
                                    </div>
                                </div>

                                <div className="border p-3 rounded-xl space-y-2.5 bg-muted/10">
                                    <span className="text-[10px] font-semibold flex items-center gap-1.5">
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-purple-400" />
                                        جووڵەی گواستنەوەی کاڵا لێرەوە:
                                    </span>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            value={transferAmount} 
                                            onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)} 
                                            className="h-8 text-xs font-mono w-20"
                                            placeholder="ڕێژە"
                                        />
                                        <Button 
                                            className="h-8 text-[10px] flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                            onClick={handleStockTransfer}
                                        >
                                            گواستنەوە بۆ پێشانگا
                                        </Button>
                                    </div>
                                    {transferError && (
                                        <p className="text-[9px] text-rose-500 font-semibold">{transferError}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Products */}
                    {activeTab === 'products' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>پێناسی بەرهەمەکان (دەستکاریکردن)</span>
                                <Button variant="outline" className="h-5 text-[8px] px-1 text-sky-400 border-sky-400/20 bg-sky-500/5 hover:bg-sky-500/10">
                                    <FileDown className="h-2.5 w-2.5 mr-1" />
                                    قاڵب
                                </Button>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <p className="text-[9px] text-muted-foreground">دووجار کلیک بکە لەسەر هەر نرخێک بۆ هەموارکردنەوەی خێرا:</p>
                                <div className="border rounded-xl overflow-hidden text-xs">
                                    <table className="w-full text-right">
                                        <thead className="bg-muted/30 border-b text-[10px]">
                                            <tr>
                                                <th className="p-2">ناو</th>
                                                <th className="p-2">جۆر</th>
                                                <th className="p-2 text-left">نرخ ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((prod) => (
                                                <tr key={prod.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                                    <td className="p-2 font-medium">{prod.name}</td>
                                                    <td className="p-2"><Badge variant="outline" className="text-[9px] px-1">{prod.category}</Badge></td>
                                                    <td className="p-2 text-left font-mono text-primary">
                                                        {editingProdId === prod.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <Input 
                                                                    type="number" 
                                                                    value={editPrice}
                                                                    onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                                                                    className="h-6 w-16 text-[10px] font-mono p-1"
                                                                    onBlur={() => {
                                                                        setProducts(products.map(p => p.id === prod.id ? {...p, price: editPrice} : p));
                                                                        setEditingProdId(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            setProducts(products.map(p => p.id === prod.id ? {...p, price: editPrice} : p));
                                                                            setEditingProdId(null);
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span 
                                                                className="cursor-pointer hover:underline decoration-dotted font-bold"
                                                                onClick={() => {
                                                                    setEditingProdId(prod.id);
                                                                    setEditPrice(prod.price);
                                                                }}
                                                            >
                                                                <ConfidentialBlur>${prod.price}</ConfidentialBlur>
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Customers */}
                    {activeTab === 'customers' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>زانیاری کڕیارەکان</span>
                                <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-400">CRM</Badge>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="border rounded-xl p-3 space-y-3 bg-muted/10 relative">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-xs">کۆسار عەلی</h5>
                                            <span className="text-[9px] text-muted-foreground">تەلەفۆن: 07701234567</span>
                                        </div>
                                        <Badge className="text-[9px] bg-rose-500/20 text-rose-400 border-none font-semibold">بڕی قەرزدار</Badge>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-2 text-[10px]">
                                        <span>قەرزی کۆکراوە:</span>
                                        <span className="font-bold text-rose-500"><ConfidentialBlur>$320.00</ConfidentialBlur></span>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1 border-t">
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="h-6 text-[9px] gap-1 px-2.5 font-bold"
                                            onClick={() => setShowCustomerWarning(true)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            سڕینەوەی کڕیار
                                        </Button>
                                    </div>
                                </div>

                                {showCustomerWarning && (
                                    <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-[10px] space-y-2">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <ShieldAlert className="h-4 w-4" />
                                            <span>هەڵە لە سڕینەوە</span>
                                        </div>
                                        <p className="text-[9px]">ناتوانرێت ئەم کڕیارە بسڕدرێتەوە چونکە فۆڕمی فرۆشتنی ژمارە (F-2026-004) بە ناوەوە تۆمار کراوە لە داتابەیسدا.</p>
                                        <div className="flex justify-end">
                                            <Button variant="ghost" className="h-5 text-[8px] text-muted-foreground hover:text-white px-2" onClick={() => setShowCustomerWarning(false)}>
                                                داخستن
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Suppliers */}
                    {activeTab === 'suppliers' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>دابینکەران</span>
                                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400">داپینکەری متمانەپێکراو</Badge>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="border rounded-xl p-3 space-y-3 bg-muted/10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-xs">کۆمپانیای ڕووناکی دۆشەک</h5>
                                            <span className="text-[9px] text-muted-foreground">ناونیشان: هەولێر، جادەی کەرکوک</span>
                                        </div>
                                        <Badge className="text-[9px] bg-indigo-500/20 text-indigo-400 border-none font-semibold">هاوردەکەر</Badge>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-2 text-[10px] text-muted-foreground">
                                        <span>پسوولە کڕینەکان:</span>
                                        <span className="font-semibold text-foreground">٣ پسوولەی فەرمی</span>
                                    </div>
                                    <div className="flex justify-end pt-1 border-t">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled 
                                            className="h-6 text-[9px] gap-1 px-2.5 opacity-50 cursor-not-allowed"
                                        >
                                            <Lock className="h-2.5 w-2.5" />
                                            سڕینەوەی دابینکەر
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[8px] text-muted-foreground text-center">دوگمەی سڕینەوە ناچالاکە چونکە پسوولەی کڕینی بەستراوەی هەیە لە کۆگادا.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Expenses */}
                    {activeTab === 'expenses' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>تۆمارکردنی خەرجییەکان</span>
                                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400">تۆماری خێرا</Badge>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                {/* Interactive Expense Add Row Form */}
                                <form onSubmit={handleAddExpense} className="border p-2 rounded-xl space-y-2 bg-muted/10">
                                    <div className="text-[9px] font-semibold text-muted-foreground mb-1">تۆمارکردنی خێرا (Inline Quick Add)</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <Input 
                                            placeholder="ناوی خەرجی" 
                                            value={newExpName} 
                                            onChange={(e) => setNewExpName(e.target.value)} 
                                            className="h-7 text-[10px] p-1.5"
                                        />
                                        <Input 
                                            placeholder="بڕ" 
                                            type="number" 
                                            value={newExpAmount} 
                                            onChange={(e) => setNewExpAmount(e.target.value)} 
                                            className="h-7 text-[10px] p-1.5 font-mono"
                                        />
                                    </div>
                                    <div className="flex gap-1.5 items-center justify-between">
                                        <div className="flex gap-1">
                                            <Button 
                                                type="button"
                                                variant="outline" 
                                                onClick={() => setNewExpCurrency('USD')} 
                                                className={cn("h-5 text-[8px] px-1.5", newExpCurrency === 'USD' && "bg-primary text-white border-primary")}
                                            >
                                                USD
                                            </Button>
                                            <Button 
                                                type="button"
                                                variant="outline" 
                                                onClick={() => setNewExpCurrency('IQD')} 
                                                className={cn("h-5 text-[8px] px-1.5", newExpCurrency === 'IQD' && "bg-primary text-white border-primary")}
                                            >
                                                IQD
                                            </Button>
                                        </div>
                                        <Button type="submit" size="sm" className="h-6 text-[9px] px-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-0.5">
                                            <Plus className="h-2.5 w-2.5" /> زیادکردن
                                        </Button>
                                    </div>
                                </form>

                                {/* Mini Table */}
                                <div className="border rounded-lg overflow-hidden text-[10px]">
                                    <div className="bg-muted/40 p-1.5 font-semibold grid grid-cols-3 border-b text-right">
                                        <span>ناوی خەرجی</span>
                                        <span>بڕ</span>
                                        <span className="text-left">دراو</span>
                                    </div>
                                    <div className="max-h-[80px] overflow-y-auto">
                                        {localExpenses.map((exp) => (
                                            <div key={exp.id} className="p-1.5 grid grid-cols-3 border-b last:border-0 hover:bg-muted/5">
                                                <span className="font-medium truncate">{exp.name}</span>
                                                <span><ConfidentialBlur>{exp.amount}</ConfidentialBlur></span>
                                                <span className="text-left font-semibold text-muted-foreground">{exp.currency}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* MOCKUP: Settings */}
                    {activeTab === 'settings' && (
                        <Card className="border border-primary/20 overflow-hidden shadow-xl bg-card">
                            <div className="bg-muted/50 px-4 py-2 text-xs border-b font-medium text-muted-foreground flex justify-between items-center">
                                <span>کۆنسۆڵی ڕێکخستنەکان</span>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSettingsSubTab('general')} 
                                        className={cn("h-5 text-[8px] px-1.5", settingsSubTab === 'general' && "bg-muted text-foreground")}
                                    >
                                        گشتی
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setSettingsSubTab('users')} 
                                        className={cn("h-5 text-[8px] px-1.5", settingsSubTab === 'users' && "bg-muted text-foreground")}
                                    >
                                        کارمەندان
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                {settingsSubTab === 'general' && (
                                    <div className="space-y-4 text-xs">
                                        <div className="flex items-center justify-between p-2.5 border rounded-xl bg-muted/20">
                                            <div className="space-y-0.5">
                                                <div className="font-bold flex items-center gap-1">
                                                    <EyeOff className="h-3.5 w-3.5 text-primary" />
                                                    <span>دۆخی شاردنەوە</span>
                                                </div>
                                                <p className="text-[9px] text-muted-foreground">شاردنەوەی سەرجەم نرخ و پارەکان</p>
                                            </div>
                                            <Switch 
                                                checked={isConfidential} 
                                                onCheckedChange={toggleConfidentialMode} 
                                                aria-label="Toggle Confidential Mode Settings"
                                            />
                                        </div>

                                        <div className="p-2.5 border rounded-xl bg-muted/20 space-y-1.5">
                                            <div className="font-bold flex items-center gap-1">
                                                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                                                <span>ئامرازی هاوتاکردنی کۆگا</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground">ڕێکخستنەوەی کۆد و ناونیشانەکان بەکۆمەڵ</p>
                                            <Button size="sm" className="h-6 w-full text-[9px] bg-slate-700 hover:bg-slate-800 text-white font-semibold">
                                                دەستپێکردنی هاوتاکردن
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {settingsSubTab === 'users' && (
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-semibold">بەکارهێنەرانی سیستەم</span>
                                            <Badge variant="outline" className="text-[8px] text-emerald-400">٢ کارمەند</Badge>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center p-2 border rounded-xl bg-muted/10 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 text-[9px] flex items-center justify-center font-bold">ب.س</div>
                                                    <div>
                                                        <div className="font-bold text-[10px]">بەرهەم سالار</div>
                                                        <div className="text-[8px] text-muted-foreground">کۆد: 1024</div>
                                                    </div>
                                                </div>
                                                <Badge className="text-[8px] bg-primary/20 text-primary border-none">Admin</Badge>
                                            </div>
                                            <div className="flex justify-between items-center p-2 border rounded-xl bg-muted/10 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-pink-500/20 text-pink-400 text-[9px] flex items-center justify-center font-bold">هـ.م</div>
                                                    <div>
                                                        <div className="font-bold text-[10px]">هێمن مستەفا</div>
                                                        <div className="text-[8px] text-muted-foreground">کۆد: 9002</div>
                                                    </div>
                                                </div>
                                                <Badge className="text-[8px] bg-amber-500/20 text-amber-400 border-none">Salesman</Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

            </div>

        </div>
    );
}
