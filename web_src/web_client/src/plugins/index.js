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
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify';
import pinia from '@/stores';
import router from '@/router';
import { createI18n } from 'vue-i18n';
import messages from '@/utils/locales/messages';
import { abilitiesPlugin } from '@casl/vue';
import { defineAbility } from '@casl/ability';

const i18n = createI18n({
  legacy: false, // Make sure legacy mode is off
  locale: 'en',
  messages: messages,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

// Define default ability
const ability = defineAbility((can) => {
  can('read', 'Post'); // Default ability for non-admin users
});

// Log the ability initialization
console.log('Ability initialized:', ability);

// Role-based rules configuration
const roleRules = {
  admin: [{ action: 'manage', subject: 'all' }],
  readonly: [{ action: 'view', subject: 'kvm' }],
  guest: [{ action: 'view', subject: 'remoteScreen' }],
  member: [
    // Manage specific systems
    { action: 'manage', subject: ['terminal', 'atx', 'msd', 'switch'] },
    // General view access
    { action: 'view', subject: 'all' },
    // Post CRUD operations
    { action: 'add', subject: 'Post' },
    { action: 'edit', subject: 'Post' },
    { action: 'delete', subject: 'Post' },
    // View users but cannot manage
    { action: 'view', subject: 'User' },
  ],

  // New "operator" role definition
  operator: [
    // Manage "switch" system only
    { action: 'manage', subject: 'switch' },

    // Can view everything
    { action: 'view', subject: 'all' },
  ],
};

// Function to dynamically update ability after login
export function updateAbilityForRole(role) {
  const rules = roleRules[role] || [];

  // Ensure rules are correctly defined before updating
  if (rules.length > 0) {
    try {
      //   ability.update([]); // revoke all permissions
      ability.update(rules);

      // Example of checking permissions
      if (ability.can('manage', 'all')) {
        console.log('User has permission to manage all.');
      }
    } catch (error) {
      console.error('Error updating ability:', error);
      console.error(error.stack);
    }
  } else {
    console.warn('No valid rules to update ability.');
  }

  if (!ability || typeof ability.update !== 'function') {
    console.error('Ability is not defined or invalid.');
    return;
  }
}

export function registerPlugins(app) {
  app.use(vuetify).use(router).use(i18n).use(pinia); // Ensure Pinia is initialized first

  app.use(abilitiesPlugin, ability); // Provide CASL ability globally
}

export { ability };
