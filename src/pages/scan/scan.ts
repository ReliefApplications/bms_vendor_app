import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { VoucherProvider } from '../../providers/voucher/voucher';
import { Vendor } from '../../model/vendor';
import { Storage } from '@ionic/storage';
import { Voucher } from '../../model/voucher';
import { ProductsPage } from '../products/products';
import { ChosenProduct } from '../../model/chosenProduct';
import { AlertController } from 'ionic-angular';
import CryptoJS from 'crypto-js';

@IonicPage()
@Component({
    selector: 'page-scan',
    templateUrl: 'scan.html',
})
export class ScanPage {

    vouchers: Array<Voucher> = [];
    vouchersTotalValue = 0;
    price$: BehaviorSubject<number>;
    chosenProducts$: BehaviorSubject<ChosenProduct[]>;
    vendor: Vendor;
    scanDisabled = false;
    tries: number;
    triesMessage: string;
    priceTooHigh = true;
    scannedVouchers = [];

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private barcodeScanner: BarcodeScanner,
        public voucherProvider: VoucherProvider,
        private storage: Storage,
        private alertCtrl: AlertController) {
    }

    /**
     * Method executed on component creation
     */
    ngOnInit() {
        this.price$ = this.voucherProvider.getPrice();
        this.chosenProducts$ = this.voucherProvider.getChosenProducts();
        this.price$.subscribe(price => {
            // TODO: do something
        });
        this.chosenProducts$.subscribe();
        this.storage.get('vendor').then(vendor => {
            this.vendor = vendor;
        });
        this.tries = 3;
        this.triesMessage = 'You have only three tries before your booklet deactivates.';
    }

    /**
     * Scan voucher QR code
     */
    scanCode() {
        let scannedCode = '';
        this.barcodeScanner.scan().then(barcodeData => {
            scannedCode = barcodeData.text;
            scannedCode = scannedCode.replace(/ /g, '+');
            if (this.scannedVouchers.includes(scannedCode)) {
                this.alert('Voucher Already Used', 'You already used this voucher');
            } else {
                this.scannedVouchers.push(scannedCode);
                this.ifHasNoPasswordGetInfo(scannedCode).then(success => {
                    this.handleScannedCode(scannedCode, success);
                }, reject => {
                    this.alert('Format', reject);
                });
            }
        });

        // scannedCode = 'AFN3*0-5-4-15';
        // if (this.scannedVouchers.includes(scannedCode)) {
        //     this.alert('Voucher Already Used', 'You already used this voucher');
        // } else {
        //     this.scannedVouchers.push(scannedCode)
        //     this.ifHasNoPasswordGetInfo(scannedCode).then(success => {
        //         this.handleScannedCode(scannedCode, success);
        //     }, reject => {
        //         this.alert('Format', reject);
        //     });
        // }
    }

    /**
     * Get voucher info if has no password
     * @param  scannedCode
     */
    ifHasNoPasswordGetInfo(scannedCode: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const passwords = [];
            let bookletCode = '';
            let scannedCodeInfo = scannedCode.match(/^([A-Z$€£]+)(\d+)\*([\d]+-[\d]+-[\d]+)-([\d]+)-([\dA-Z=+-\/]+)$/i);
            if (scannedCodeInfo !== null) {
                passwords.push(scannedCodeInfo[5]);
                bookletCode = scannedCodeInfo[3];
            } else {
                scannedCodeInfo = scannedCode.match(/^([\d]+-[\d]+-[\d]+)$/i);
                if (scannedCodeInfo !== null) {
                    reject('You cannot scan a booklet code, you have to scan the vouchers individually.');
                } else {
                    scannedCodeInfo = scannedCode.match(/^([A-Z$€£]+)(\d+)\*([\d]+-[\d]+-[\d]+)-([\d]+)$/i);
                    if (scannedCodeInfo !== null) {
                        bookletCode = scannedCodeInfo[3];
                    } else {
                        reject('Your code isn\'t the right format, are you sure it is a BMS Voucher ?');
                    }
                }
            }

            this.storage.get('protectedBooklets').then(booklets => {
                booklets.forEach(booklet => {
                    if (booklet.hasOwnProperty(bookletCode)) {
                        passwords.push(booklet[bookletCode]);
                    }
                });
                if (passwords.length > 0) {
                    this.tries = 3;
                    this.triesMessage = 'You have only three tries before your booklet deactivates.';
                    this.openPasswordModal(scannedCode, passwords, scannedCodeInfo);
                } else {
                    resolve(scannedCodeInfo);
                }
            });
        });
    }


    /**
     * Open password modal
     * @param  scannedCode
     * @param  scannedCodeInfo
     */
    openPasswordModal(scannedCode: string, passwords: string[], scannedCodeInfo: string[]) {
        const alert = this.alertCtrl.create({
            cssClass: 'wide-alert',
            title: 'Password',
            subTitle: 'Please enter the voucher\'s password',
            buttons: [
                {
                    text: 'Cancel',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Submit',
                    handler: data => {
                        this.handlePasswordSubmit(data, scannedCode, passwords, scannedCodeInfo);
                    }
                }
            ],
            inputs: [
                {
                    name: 'password',
                    type: 'password',
                    placeholder: '**********'
                }
            ],
            message: this.triesMessage
        });
        alert.present();
    }

    /**
     * Handle the data returned by the password modal (WARNING RECURSIVE !!)
     * @param  data
     * @param  scannedCode
     * @param  scannedCodeInfo
     * @param  passwords
     */
    public handlePasswordSubmit(data: any, scannedCode: string, passwords: string[], scannedCodeInfo: string[]) {
        if (data.password && passwords.includes(this.salt(data.password))) {
            this.handleScannedCode(scannedCode, scannedCodeInfo);
        } else {
            this.tries -= 1;
            if (this.tries === 0) {
                this.storage.get('deactivatedBooklets').then(cacheBooklets => {
                        const alreadyStoredBooklets = cacheBooklets || [];
                        alreadyStoredBooklets.push(scannedCodeInfo[3]);
                        this.storage.set('deactivatedBooklets', alreadyStoredBooklets);
                    });
                    this.alert('Booklet deactivated', 'You have exceeded your tries at password, your booklet will be deactivated');
                    return;
            }
            this.triesMessage = 'You didn\'t type the right password. You have only ' +
                this.tries + ' tries left.';
            this.openPasswordModal(scannedCode, passwords, scannedCodeInfo);
        }
    }

     /**
     * Salt password
     * @param  password
     */
    public salt(password: string): string {
        return CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64);
    }


    /**
     * Handle scanned voucher
     * @param  scannedCode
     * @param  scannedCodeInfo
     */
    handleScannedCode(scannedCode: string, scannedCodeInfo: string[]) {
        if (scannedCodeInfo === null) {
            this.alert('Format', 'Your code isn\'t the right format, are you sure it is a BMS Voucher ?');
        }
        const previousBooklet = this.vouchers.length ? this.vouchers[0].booklet : null;
        // previousBooklet = 'iK01m*0-4-1'; // to delete after
        const newBooklet = scannedCodeInfo[3];

        this.storage.get('deactivatedBooklets').then(deactivatedBooklets => {
            if (deactivatedBooklets && deactivatedBooklets.includes(newBooklet)) {
                this.alert('Booklet deactivated', 'You cannot use this booklet because it has previously been deactivated.');
                return;
            }
            if (previousBooklet && previousBooklet !== newBooklet) {
                this.openDifferentBookletModal();
                return;
            }

            const productIds = [];

            if (scannedCodeInfo[1] !== this.chosenProducts$.getValue()[0].currency) {
                this.alert('Currency Mismatch', 'This voucher is not in the right currency.');
                return;
            }

            this.chosenProducts$.getValue().forEach(chosenPoduct => {
                productIds.push(chosenPoduct.product.id);
            });
            this.vouchers.push({
                id: parseInt(scannedCodeInfo[4], 10),
                qrCode: scannedCode,
                vendorId: this.vendor.id,
                productIds: productIds,
                price: this.price$.getValue(),
                currency: scannedCodeInfo[1],
                value: parseInt(scannedCodeInfo[2], 10),
                booklet: scannedCodeInfo[3],
                used_at: new Date()
            });
            const scannedCodeValue = scannedCodeInfo[2];
            this.vouchersTotalValue += parseInt(scannedCodeValue, 10);

            if (this.vouchersTotalValue >= this.price$.getValue()) {
                this.priceTooHigh = false;
            }
        });
    }

    /**
     * Open modal warning for a voucher from a different booklet
     */
    async openDifferentBookletModal() {
        const alert = this.alertCtrl.create({
            cssClass: 'wide-alert',
            title: 'Different booklet',
            buttons: [
                {
                    text: 'Back to the scan page',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Cancel transaction',
                    handler: data => {
                        this.cancelTransaction();
                    }
                }
            ],
            message: 'You now are using the booklet of another beneficiary.' +
            ' Are you sure you want to end the previous transaction and move on to a new one?' +
            ' Your previous vouchers won\'t be considered as used and your products list will empty.'
        });
        alert.present();
    }

    /**
     * Open proceed modal
     */
    async openProceedModal() {

        const alert = this.alertCtrl.create({
            cssClass: 'wide-alert',
            title: 'Proceed with transaction',
            buttons: [
                {
                    text: 'Back to the scan page',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Proceed',
                    handler: data => {
                        this.completeTransaction();
                    }
                }
            ],
            message: 'Are you sure you want to proceed with this transaction ?' +
            ' Your vouchers will be considered as used and kept by the vendor.'
        });
        alert.present();
    }

    /**
     * Open cancel modal
     */
    async openCancelModal() {

        const alert = this.alertCtrl.create({
            cssClass: 'wide-alert',
            title: 'Cancel transaction',
            buttons: [
                {
                    text: 'Back to the scan page',
                    handler: () => {
                        return;
                    }
                },
                {
                    text: 'Cancel transaction',
                    handler: data => {
                        this.cancelTransaction();
                    }
                }
            ],
            message: 'Are you sure you want to clear the selected items?'
        });
        alert.present();
    }

    /**
     * Complete transaction and go to products page
     */
    completeTransaction() {
        this.voucherProvider.scanVouchers(this.vouchers);
        this.navCtrl.push(ProductsPage);
        this.alert(
            'Transaction completed',
            'Your ' + this.vouchersTotalValue + this.vouchers[0].currency + ' transaction has been confirmed'
        );
    }

    /**
     * Cancel transaction and go to products page
     */
    cancelTransaction() {
        this.vouchers = [];
        this.vouchersTotalValue = 0;
        this.voucherProvider.setPrice(null);
        this.voucherProvider.setChosenProducts([]);
        this.navCtrl.push(ProductsPage);
        this.alert(
            'Transaction canceled',
            'Your transaction has been canceled and your vouchers were not used'
        );
    }

    /**
     * Opens an alert with only text
     */
    alert(title: string, message: string) {
        const alert = this.alertCtrl.create({
            title: title,
            buttons: ['OK'],
            message: message
        });
        alert.present();
    }
}
