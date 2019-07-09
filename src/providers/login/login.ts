import { Injectable } from '@angular/core';
import { Vendor } from '../../model/vendor';
import * as CryptoJS from 'crypto-js';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Storage } from '@ionic/storage';
import { SaltInterface } from '../../model/salt';


@Injectable()
export class LoginProvider {

    private vendor = new Vendor;
    URL_BMS_API: string = process.env.URL_BMS_API;

    constructor(
        public http: HttpClient,
        private storage: Storage) {
    }

    /**
     * Get user salt from backend
     * @param  username
     */
    requestSalt(username: string): Observable<SaltInterface> {
        return this.http.get<SaltInterface>(this.URL_BMS_API + '/salt/' + username);
    }

    /**
     * Log in user in backend
     * @param  vendor
     */
    logUser(vendor: Vendor) {
        return this.http.post(this.URL_BMS_API + '/login_app', vendor);
    }

    /**
     * Login method to log vendor in app
     * @param  vendor
     */
    login(vendor: Vendor) {
        return new Promise<Vendor | string | null>((resolve, reject) => {
            this.requestSalt(vendor.username).subscribe(salt => {
                const getSalt = salt as SaltInterface;
                vendor.salted_password = this.saltPassword(getSalt.salt, vendor.password);
                delete vendor.password;
                return this.logUser(vendor).subscribe((data: any) => {
                    if (data) {
                        this.vendor = data as Vendor;
                        this.vendor.salted_password = vendor.salted_password;
                        this.vendor.loggedIn = true;
                        this.vendor.country = this.getCountryFromLocation(data.location);
                        this.storage.set('vendor', this.vendor);
                        this.storage.set('country', this.vendor.country);
                        resolve(this.vendor);
                    } else {
                        reject('Bad credentials');
                    }
                }, error => {
                    reject(this.handleError(error) || 'Bad credentials');
                });
            }, error => {
                reject(this.handleError(error) || 'Bad credentials');
            });
        });
    }

    /**
     * Salt user password
     * @param  salt
     * @param  password
     */
    saltPassword(salt: string, password: string): string {
        const salted = password + '{' + salt + '}';
        let digest = CryptoJS.SHA512(salted);

        for (let i = 1; i < 5000; i++) {
            digest = CryptoJS.SHA512(digest.concat(CryptoJS.enc.Utf8.parse(salted)));
        }

        const saltedPassword = CryptoJS.enc.Base64.stringify(digest);
        return saltedPassword;
    }

    /**
     * Handle error
     * @param  error
     */
    handleError(error) {
        if (error.error) {
            if (typeof error.error === 'string') {
                return error.error;
            } else if (error.error[0]) {
                return error.error[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Get the vendor's country from their location
     * @param  error
     */
    getCountryFromLocation(location) {
        let adm1;
        if (location.adm1) {
            adm1 = location.adm1;
        } else if (location.adm2) {
            adm1 = location.adm2.adm1;
        } else if (location.adm3) {
            adm1 = location.adm3.adm2.adm1;
        } else  if (location.adm4) {
            adm1 = location.adm4.adm3.adm2.adm1;
        }

        return adm1.country_i_s_o3;
    }
}
