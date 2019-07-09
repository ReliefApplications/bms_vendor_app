import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Voucher } from '../../model/voucher';
import { Product } from '../../model/product';
import { Booklet } from '../../model/booklet';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SyncProvider {

    private products = new BehaviorSubject<Product[]>([]);

    constructor(public http: HttpClient, private storage: Storage) {
    }

    URL_BMS_API: string = process.env.URL_BMS_API;

    /**
     * Sync with backend
     * @param  vouchers
     * @param  booklets
     */
    sync(vouchers: Voucher[], booklets: string[]) {
        return new Promise((resolve, reject) => {
            this.sendVouchers(vouchers).subscribe(() => {
                this.sendBooklets(booklets).subscribe(() => {
                    this.getDeactivatedBooklets().then(res => {
                        this.getProtectedBooklets().then(success => {
                            resolve(success);
                        }, error => {
                            reject(error);
                        });
                    }, error => {
                        reject(error);
                    });
                }, error => {
                    reject(error);
                });
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Send vouchers
     * @param  vouchers
     */
    sendVouchers(vouchers: Voucher[]) {
        return this.http.post(this.URL_BMS_API + '/vouchers/scanned', vouchers);
    }

    /**
     * Send booklets
     * @param  booklets
     */
    sendBooklets(booklets: string[]) {
        const body = {
            bookletCodes: booklets
        };
        return this.http.post(this.URL_BMS_API + '/deactivate-booklets', body);
    }

    /**
     * Get deactivated booklets
     */
    getDeactivatedBooklets() {
        return new Promise((resolve, reject) => {
            this.http.get<Array<Booklet>>(this.URL_BMS_API + '/deactivated-booklets').subscribe(deactivatedBooklets => {
                const deactivatedBookletCodes = [];
                deactivatedBooklets.forEach(booklet => {
                    deactivatedBookletCodes.push(booklet.code);
                });
                this.storage.set('deactivatedBooklets', deactivatedBookletCodes);
                resolve(deactivatedBooklets);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Get protected booklets
     */
    getProtectedBooklets() {
        return new Promise((resolve, reject) => {
            this.http.get<Array<Booklet>>(this.URL_BMS_API + '/protected-booklets').subscribe(protectedBooklets => {
                this.storage.set('protectedBooklets', protectedBooklets);
                resolve(protectedBooklets);
            }, error => {
                reject(error);
            });
        });
    }

    /**
     * Get products from backend
     */
    getProductsFromApi() {
        this.http.get<Array<Product>>(this.URL_BMS_API + '/products',).subscribe(products => {
            const productList = [];
            products.forEach(product => {
                productList.push({
                    id: product.id,
                    name: product.name,
                    unit: product.unit,
                    image: product.image
                });
            });
            this.products.next(productList);
            this.storage.set('products', productList);
        }, error => {
            this.storage.get('products').then(products => {
                this.products.next(products);
            });
        });
    }

    /**
     * Get products stored in service
     */
    getProducts(): BehaviorSubject<Product[]> {
        return this.products;
    }
}
