import { GlobalText } from '../texts/global';

export class ErrorInterface {
    message: string;
}

export class Vendor {
    static __classname__ = 'Vendor';
    /**
	 * User id
	 * @type {string}
	 */
    id = '';
    /**
	 * Username
	 * @type {string}
	 */
    username = '';
    /**
	 * Plain text password
	 * @type {string}
	 */
    password = '';
    /**
	 * Salted password
	 * @type {string}
	 */
    salted_password = '';
    /**
	 * Name
	 * @type {string}
	 */
    name = '';
    /**
	 * Shop
	 * @type {string}
	 */

    shop = '';
    /**
	 * Address
	 * @type {string}
	 */
    address = '';
    /**
	 * loggedIn state
	 * @type {boolean}
	 */
    loggedIn = false;
    /**
	 * Vendor's vouchers
	 * @type {string[]}
	 */
    products: string[] = [];
    /**
	 * Vendor's country
	 * @type {string}
	 */
    country: string = undefined;
    /**
	 * Vendor's language
	 * @type {string}
	 */
    language = '';

    constructor(instance?) {
        if (instance !== undefined) {
            this.id = instance.id;
            this.username = instance.username;
            this.password = instance.password;
            this.name = instance.name;
            this.shop = instance.shop;
            this.address = instance.address;
            this.salted_password = instance.salted_password;
            this.products = instance.products;
            this.country = instance.country;
            this.loggedIn = instance.loggedIn;
            this.language = instance.language;
        }
    }

    /**
     * Get displayed name
     */
    public static getDisplayedName() {
        return GlobalText.TEXTS.model_user;
    }

    /**
     * Map all properties of object
     * @param  selfinstance
     */
    static mapAllProperties(selfinstance): Object {
        if (!selfinstance) {
            return selfinstance;
        }

        const products = [];
        selfinstance.products.forEach(product => {
            products.push(product);
        });

        return {
            id: selfinstance.id,
            name: selfinstance.name,
            username: selfinstance.username,
            shop: selfinstance.shop,
            salted_password: selfinstance.salted_password,
            address: selfinstance.address,
            products: products,
            country: selfinstance.country
        };
    }

    /**
	* Eeturn User properties name displayed
	*/
    static translator(): Object {
        return {
            username: GlobalText.TEXTS.email,
            password: GlobalText.TEXTS.model_user_password,
            rights: GlobalText.TEXTS.rights,
            projects: GlobalText.TEXTS.project,
            country: GlobalText.TEXTS.model_countryIso3,
        };
    }

    /**
     * Get all countries
     */
    public static getAllCountries() {
        return [
            {
                'id': 'KHM',
                'name': 'Cambodia',
            },
            {
                'id': 'SYR',
                'name': 'Syria',
            }
        ];
    }
}
