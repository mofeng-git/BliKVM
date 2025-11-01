/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/
// http.js
import axios from 'axios';
import Config from '@/config.js';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/stores/stores';

const apiUrl = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/api`;
console.log(apiUrl);

const http = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

http.interceptors.request.use(
  (config) => {
    const store = useAppStore();
    const { account } = storeToRefs(store);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const user = account.value.user;
    if (user) {
      config.headers.Username = user;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error(error.response);
      console.error('Authentication failed, redirecting to login page...');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default http;
