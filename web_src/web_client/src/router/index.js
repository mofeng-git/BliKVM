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

/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import { createRouter, createWebHistory } from 'vue-router/auto';
import { setupLayouts } from 'virtual:generated-layouts';
import { routes } from 'vue-router/auto-routes';

// Modify the existing routes if needed
for (const route of routes) {
  if (route.name === '/main') {
    console.log(route);
    route.meta = route.meta || {};
    // Uncomment this line if you want to require authentication for the main route
    // route.meta.requiresAuth = true;
  }
}

// Create the router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...setupLayouts(routes), // Spread the existing routes
    {
      path: '/matrix',
      name: 'Matrix',
      component: () => import('@/pages/Matrix.vue'),
      // meta: { requiresAuth: true }
    },
  ],
});

// Global navigation guard for authentication
router.beforeEach((to, from, next) => {
  console.log('to.matched:', to.matched);
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const token = localStorage.getItem('token'); // TODO get from store

  console.log('token', token);
  console.log('Navigating to:', to.path);

  if (requiresAuth && !token) {
    next('/'); // Redirect to home if authentication is required and no token is present
  } else {
    if (token) {
      console.log('token valid');
    } else {
      console.log("don't need auth");
    }
    next(); // Proceed to the route
  }
});

export default router;
