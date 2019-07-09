import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { AndroidFullScreen } from '@ionic-native/android-full-screen';
import { Keyboard } from '@ionic-native/keyboard/ngx';

import { MyApp } from './app.component';

// Pages
import { ScanPage } from '../pages/scan/scan';
import { LoginPage } from '../pages/login/login';
import { ProductsPage } from '../pages/products/products';

// Components
import { ComponentsModule } from '../components/components.module';

// Plugins
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginProvider } from '../providers/login/login';

// Material
import { MatButtonModule, MatSelectModule, MatSidenavModule, MatInputModule, MatListModule } from '@angular/material';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import { HttpClientModule } from '@angular/common/http';
import { VoucherProvider } from '../providers/voucher/voucher';
import { IonicStorageModule } from '@ionic/storage';
import { SyncProvider } from '../providers/sync/sync';
import { WsseProvider } from '../providers/wsse/wsse';
import { httpInterceptorProviders } from '../interceptors/index-interceptors';


@NgModule({
    declarations: [
        MyApp,

        // Pages
        ScanPage,
        ProductsPage,
        LoginPage,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp),
        NgxQRCodeModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatSelectModule,
        MatSidenavModule,
        MatInputModule,
        MatListModule,
        HttpClientModule,
        IonicStorageModule.forRoot({
            driverOrder: ['indexeddb', 'sqlite', 'websql']
        }),
        ComponentsModule,
        MatProgressSpinnerModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,

        // Pages
        ScanPage,
        ProductsPage,
        LoginPage,
    ],
    providers: [
        StatusBar,
        SplashScreen,
        AndroidFullScreen,
        Keyboard,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        httpInterceptorProviders,

        // Plugins
        BarcodeScanner,
        LoginProvider,
        VoucherProvider,
        SyncProvider,
        WsseProvider,
    ]
})
export class AppModule { }
