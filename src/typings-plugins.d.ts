declare module '@awesome-cordova-plugins/calendar/ngx' {
  export class Calendar {
    hasReadWritePermission(): Promise<boolean>;
    requestReadWritePermission(): Promise<boolean>;
    createEvent(title: string, location: string | null, notes: string | null, startDate: Date, endDate: Date): Promise<any>;
    deleteEvent(title: string, location: string | null, notes: string | null, startDate: Date, endDate: Date): Promise<any>;
  }
}
