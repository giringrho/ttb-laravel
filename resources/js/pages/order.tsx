import { Head, useForm } from "@inertiajs/react";
import { Upload } from "lucide-react";
import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useRef, useState } from 'react';

export default function Order({ jobKeys }: { jobKeys?: string[] }) {
    const { data, setData, post, processing, errors } = useForm<{files: File[] | null;}>({files: null});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [polling, setPolling] = useState(false);
    const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<Order>([]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post("/", {
            preserveScroll: true,
            onSuccess: () => {
                setPolling(true);
                setResults([]);
                setCompletedKeys(new Set());
            },
        });
    }

    const keysPolling = useRef<Record<string, boolean>>({});
    useEffect(() => {
        if (!polling || !jobKeys || jobKeys.length === 0) return;

        const maxAttempts = 60;
        let attempts = 0;
        let completedCount = completedKeys.size;
 
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                setPolling(false);
                return;
            }
            
            for (const key of jobKeys) {
                if (completedKeys.has(key) || keysPolling.current[key]) continue;
 
                keysPolling.current[key] = true;
                const res = await fetch(`/order/status?key=${key}`);
                keysPolling.current[key] = false;
                const status = await res.json();
 
                if (status.status === "completed") {
                    completedCount++;
                    setCompletedKeys(prev => new Set(prev).add(key));
                    setResults(prev => [...prev, ...(status.validated ?? [])]);
                }
            }
 
            if (completedCount === jobKeys.length) {
                setPolling(false);
            }
        }, 500);
 
        return () => clearInterval(interval);
    }, [polling, jobKeys]);

    const hasResults = results && results.length > 0;
    const successCount = results?.filter((row: any) => row.error.length === 0).length ?? 0;
    const errorCount = results?.filter((row: any) => row.error.length > 0).length ?? 0;
    const totalCount = results?.length ?? 0;

    return (
        <>
            <Head title="Order" />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload CSV Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <input
                                ref={(el) => {
                                    fileInputRef.current = el;
                                }}
                                type="file"
                                accept=".csv,.txt"
                                className="hidden"
                                multiple={true}
                                onChange={(e) => {
                                    const files = e.target.files ? Array.from(e.target.files) : null;
                                    setData('files', files);
                                }}
                            />
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    Choose File
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {data.files && data.files.length > 0
                                        ? data.files.map(f => f.name).join(', ')
                                        : "No file selected"}
                                </span>
                            </div>
                            {errors.files && (
                                <p className="text-sm text-destructive">
                                    {errors.files}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={polling || processing || !data.files || data.files.length === 0}
                                className="w-full"
                            >
                                <Upload />
                                Upload
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {polling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="animate-spin">⟳</span>
                        Processing files in background...
                    </div>
                )}

                {hasResults && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Validation Results</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    {totalCount} row(s)
                                </Badge>
                                <Badge>
                                    {successCount} success
                                </Badge>
                                {errorCount > 0 && (
                                    <Badge variant="destructive">
                                        {errorCount} with errors
                                    </Badge>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Row</TableHead>
                                        <TableHead>Order Number</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {row.data.order_number}
                                            </TableCell>
                                            <TableCell>
                                                {row.data.sku}
                                            </TableCell>
                                            <TableCell>
                                                {row.data.qty}
                                            </TableCell>
                                            <TableCell>
                                                {row.data.price}
                                            </TableCell>
                                            <TableCell>
                                                {row.error.length === 0 ? (
                                                    <Badge>
                                                        Valid
                                                    </Badge>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {row.error.map(
                                                            (err, i) => (
                                                                <Badge
                                                                    key={i}
                                                                    variant={err == 'Order already exists, updated' ? "secondary" : "destructive"}
                                                                >
                                                                    {err}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Jawaban Setelah Coding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h3>1. Dari mana proses upload file dimulai?</h3>
                        <p>Ketika button upload diklik dan akan run fungsi submit() yang di trigger dari onSubmit {"<form>"}. Lalu fungsi submit() akan melakukan request ke endpoint "/" dengan methode POST.</p>
                        <br />
                        <h3>2. Di bagian mana validasi dilakukan?</h3>
                        <p>Validasi dilakukan di backend, di job OrderValidateJob.php fungsi validateData()</p>
                        <br />
                        <h3>3. Bagaimana data disimpan ke database?</h3>
                        <p>Data disimpan di OrderSave.php dengan menggunakan transaction supaya data konsisten</p>
                        <br />
                        <h3>4. Bagaimana Anda mencegah order duplikat?</h3>
                        <p>Di OrderSave.php dilakukan pengencekan order_number yang sudah ada di database. jika sudah ada maka lakukan update, jika belum maka lakukan insert</p>
                        <br />
                        <h3>5. Jika file berisi 100.000 baris, bagian mana yang berpotensi bermasalah?</h3>
                        <p>Jika menggunakan syncronous processing, maka akan memakan waktu yang lama. Untuk mengatasi hal ini, bisa menggunakan asyncronous processing dengan menggunakan queue. Dan untuk mengatasi potensi inkonsistensi data akibat queue, maka setiap operasi DB menggunakan transaction.</p>
                        <br />
                        <p>Untuk sekarang implementasi queue masih per file sebagai contoh (untuk tes bisa dilakukan multiple file), dan bisa juga diimplementasikan per row/chunk supaya worker bisa memproses per row/chunk.</p>
                        <br />
                        <h3>6. Jika satu order ternyata masuk dua kali, bagaimana Anda mulai mencari penyebab bug?</h3>
                        <p>Pertama, cek dulu ke DB, cari apa yang menyebabkan data masuk 2 kali. Seharusnya jika order_number sudah unique, dan sudah dilakukan check duplikasi, maka data tidak akan masuk 2 kali. Tapi jika memang masih masuk ke DB, berarti order_number beda.</p>
                        <br />
                        <p>Kedua, cek ke backend, cari fungsi-fungsi yang berkaitan dengan DB tersebut, telusuri alurnya dan cari tau apakah ada yang men trigger fungsi (misal createOrder()) 2 kali, jika iya maka perbaiki.</p>
                        <br />
                        <p>Ketiga, cek ke frontend, apakah button ter trigger 2 kali, jika iya maka tambahkan disable button setelah pertama kali di klik. Terlusuri juga alur fungsi-fungsi di alur frontend, pastikan tidak ada trigger 2 kali.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Link Repository</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a href="https://github.com/giringrho/ttb-laravel" target="_blank" rel="noopener noreferrer">
                            https://github.com/giringrho/ttb-laravel
                        </a>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
