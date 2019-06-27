import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { KeysPipe } from './pipes/keys.pipe';
import { MatSelectModule } from '@angular/material/select';
import { AddAreaComponent } from './add-area/add-area.component';
import { RoutingComponent } from './routing/routing.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoginComponent } from './login/login.component';
import { CookieService } from 'ngx-cookie-service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AddUserComponent } from './add-user/add-user.component';
import { MatIconModule } from '@angular/material/icon';
import { FilterProfilsPipe } from './pipes/filter-profils.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SizeFilePipe } from './pipes/size-file.pipe';
import {MatTooltipModule} from '@angular/material/tooltip';




@NgModule({
  declarations: [
    AppComponent,
    KeysPipe,
    AddAreaComponent,
    RoutingComponent,
    LoginComponent,
    ChangePasswordComponent,
    AddUserComponent,
    FilterProfilsPipe,
    SizeFilePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule, MatCheckboxModule,
    MatInputModule, MatSelectModule,
    FormsModule, MatDialogModule, MatCardModule, MatIconModule, MatToolbarModule, MatMenuModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatTooltipModule,
    LeafletModule.forRoot(),
    // SocketIoModule.forRoot(config)
  ],
  entryComponents: [LoginComponent, ChangePasswordComponent, AddUserComponent],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
