import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor(private http: HttpClient) {}

  executeQuery<T>(type: any, query: any, data: any) {
    query = apiUrl + query;
    const options = {
      body: data,
    };

    return this.http.request<T>(type, query, options);
  }
}
