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

import dgram from 'dgram';

class WakeOnLan {
  /**
   * Creates a new WakeOnLan instance.
   * @param {string} macAddress - The MAC address of the device to wake up.
   * @param {string} [broadcastAddress='255.255.255.255'] - The broadcast address to send the magic packet to.
   * @param {number} [port=9] - The port to send the magic packet on (default is 9).
   */
  constructor(macAddress, broadcastAddress = '255.255.255.255', port = 9) {
    this.macAddress = macAddress;
    this.broadcastAddress = broadcastAddress;
    this.port = port;
  }

  /**
   * Sends a magic packet to wake up the device.
   * @returns {Promise<void>} - A promise that resolves when the packet is sent.
   */
  sendMagicPacket() {
    return new Promise((resolve, reject) => {
      // Convert MAC address to a buffer
      const macBuffer = this._createMacBuffer();

      // Create the magic packet
      const magicPacket = Buffer.alloc(6 + 16 * macBuffer.length);
      magicPacket.fill(0xff, 0, 6); // Fill the first 6 bytes with 0xff
      for (let i = 0; i < 16; i++) {
        macBuffer.copy(magicPacket, 6 + i * macBuffer.length);
      }

      // Create a UDP socket and send the magic packet
      const socket = dgram.createSocket('udp4');
      socket.bind(() => {
        socket.setBroadcast(true);
        socket.send(magicPacket, 0, magicPacket.length, this.port, this.broadcastAddress, (err) => {
          socket.close();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Creates a buffer from the MAC address.
   * @returns {Buffer} - The buffer containing the MAC address.
   * @private
   */
  _createMacBuffer() {
    const macAddressHex = this.macAddress.replace(/:/g, '');
    if (macAddressHex.length !== 12) {
      throw new Error('Invalid MAC address');
    }
    return Buffer.from(macAddressHex, 'hex');
  }
}

export default WakeOnLan;
