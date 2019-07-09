import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { from } from 'rxjs/observable/from';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class CountryInterceptor implements HttpInterceptor {

    constructor(
        private storage: Storage
    ) {}

    /**
	 * Intercept requests to backend to add country header when available
	 * @param  req
	 * @param  next
	 */
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return from(this.storage.get('country')).pipe(
            switchMap(
                country => {
                    if (country) {
                        return next.handle(
                            req.clone({
                                headers: req.headers.append('country', country),
                            })
                        );
                    }

                    return next.handle(req);
                }
            )
        );

    }
}
