import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ScanPage } from '../scan/scan';
import { VoucherProvider } from '../../providers/voucher/voucher';
import { Product } from '../../model/product';
import { Observable } from 'rxjs';
import { SyncProvider } from '../../providers/sync/sync';
import { ChosenProduct } from '../../model/chosenProduct';
import { AlertController } from 'ionic-angular';
import { CURRENCIES } from '../../model/currencies';
import { FormGroup, FormControl } from '@angular/forms';
import { Storage } from '@ionic/storage';

@IonicPage()
@Component({
    selector: 'page-products',
    templateUrl: 'products.html',
})
export class ProductsPage implements OnInit {

    products$: Observable<Product[]>;

    public isItemSelected = false;
    public selectedProduct: Product = null;
    public allChosenProducts: Array<any> = [];

    public typing = 'quantity';
    public quantity: string;
    public price: string;
    public total = 0;

    public currencies = CURRENCIES;
    public form: FormGroup;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public voucherProvider: VoucherProvider,
        private syncProvider: SyncProvider,
        private alertCtrl: AlertController,
        private storage: Storage,
    ) {
    }

    /**
     * Method executed on component creation
     */
    ngOnInit() {
        this.syncProvider.getProductsFromApi();
        this.products$ = this.syncProvider.getProducts();
        this.products$.subscribe(products => {
            // TODO: do something
        });
    }

    /**
     * Navigate to scan page
     */
    goToScanPage() {
        this.voucherProvider.setPrice(this.total);
        this.voucherProvider.setChosenProducts(this.allChosenProducts);
        this.navCtrl.push(ScanPage);
    }

    /**
     * Select product
     * @param  product
     */
    selectProduct(product) {
        if (product === this.selectedProduct) {
            this.clearSelection();
        } else {
            this.clearSelection();
            this.isItemSelected = true;
            this.selectedProduct = product;
            if (this.allChosenProducts[0] && this.allChosenProducts[0].currency) {
                this.form.controls.currency.setValue(this.allChosenProducts[0].currency);
                this.form.controls.currency.disable();
            } else {
                let currency: string;
                this.storage.get('country').then(country => {
                    if (country === 'KHM') {
                        currency = 'KHR';
                    } else if (country === 'SYR') {
                        currency = 'SYP';
                    }
                    if (this.form) {
                        this.form.controls.currency.setValue(currency);
                        this.form.controls.currency.enable();
                    } else {
                        const formControls = {
                            currency: new FormControl(currency)
                        };
                        this.form = new FormGroup(formControls);
                    }
                });
            }
        }
    }

    /**
     * Create short animation for right-hand drawer
     * @param  drawer
     */
    animateDrawer(drawer) {
        drawer.close();
        setTimeout(() => {
            drawer.open();
        }, 300);
    }

    /**
     * Add product to basket
     */
    addToBasket() {
        if (this.quantity && this.price) {
            const quantity = parseFloat(this.quantity);
            const price = parseFloat(this.price);
            this.allChosenProducts.push({
                product: this.selectedProduct,
                quantity: quantity,
                price: price,
                subTotal: Math.round(price * quantity * 100) / 100,  // To have 2 decimals for the cents
                currency: this.form.controls.currency.value
            });
            this.total = 0;
            this.allChosenProducts.forEach(element => {
                this.total += element.subTotal;
                this.total = Math.round(this.total * 100 ) / 100;
            });
        }
        this.clearSelection();
    }

    /**
     * Clear selected product
     */
    clearSelection() {
        this.isItemSelected = false;
        this.selectedProduct = null;
        this.typing = 'quantity';
        this.quantity = null;
        this.price = null;
    }

    /**
     * Clear selected products (basket)
     */
    clearItemList() {
        const alert = this.alertCtrl.create({
            title: 'Empty cart',
            buttons: [
                {
                    text: 'No',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Yes',
                    handler: data => {
                        this.allChosenProducts = [];
                        this.total = 0;
                    }
                }
            ],
            message: 'Are you sure you want to empty your cart ?'
        });
        alert.present();
    }

    /**
     * Remove a product from the cart
     */
    removeFromCart(item: ChosenProduct) {
        const alert = this.alertCtrl.create({
            title: 'Remove product',
            buttons: [
                {
                    text: 'No',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Yes',
                    handler: data => {
                        this.allChosenProducts = this.allChosenProducts.filter((product, index, array) => {
                            return product !== item;
                        });
                        this.total = Math.round((this.total - item.subTotal) * 100 ) / 100;
                    }
                }
            ],
            message: 'Are you sure you want to remove this product from your cart ?'
        });
        alert.present();
    }
}

