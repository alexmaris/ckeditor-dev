/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	'use strict';

	CKEDITOR.plugins.add( 'pastefromwordimage', {
		requires: 'pastefromword',
		init: function( editor ) {
			// Check it!
			if ( !CKEDITOR.plugins.clipboard.isCustomDataTypesSupported ) {
				return;
			}

			// Register a proper filter, so that images are not stripped out.
			editor.filter.allow( 'img[src]' );

			editor.on( 'afterPasteFromWord', this.pasteListener, this );
		},

		pasteListener: function( evt ) {
			var imgTags,
				base64images = [],
				hexImages,
				length,
				i;

			function hexToBase64( hexString ) {
				return CKEDITOR.tools.convertBytesToBase64( CKEDITOR.tools.convertHexStringToBytes( hexString ) );
			}

			imgTags = CKEDITOR.plugins.pastefromwordimage.extractImgTagsFromHtmlString( evt.data.dataValue );
			if ( imgTags.length === 0 ) {
				return;
			}

			hexImages = CKEDITOR.plugins.pastefromwordimage.extractImagesFromRtf( evt.data.dataTransfer[ 'text/rtf' ] );
			if ( hexImages.length === 0 ) {
				return;
			}

			CKEDITOR.tools.array.forEach( hexImages, function( img ) {
				base64images.push( img.type ? 'data:' + img.type + ';base64,' + hexToBase64( img.hex ) : null );
			} );

			// Assumption there is equal amout of Images in RTF and HTML source, so we can match them accoriding to existing order.
			if ( imgTags.length === base64images.length ) {
				length = imgTags.length;
				for ( i = 0; i < length; i++ ) {
					if ( ( imgTags[ i ][ 1 ].indexOf( 'file://' ) === 0 ) && base64images[ i ] ) {
						evt.data.dataValue = evt.data.dataValue.replace( imgTags[ i ][ 1 ], base64images[ i ] );
					}
				}
			} else {
				throw new Error( 'There is problem with embeding images from word.' );
			}
		}
	} );

	/**
	 * Help methods used by paste from word image plugin.
	 *
	 * @since 4.8.0
	 * @class CKEDITOR.plugins.pastefromwordimage
	 */
	CKEDITOR.plugins.pastefromwordimage = {
		/**
		 * Methods parse rtf clipboard to find embeded images.
		 *
		 * @private
		 * @since 4.8.0
		 * @param {String} rtfClipboard Data obtained from rtf clipboard.
		 * @returns {Array} Contains array of objects with images.
		 * @returns {Object} return.Object Single image found in `rtfClipboard`.
		 * @returns {String/null} return.Object.hex Hexadecimal string of image embeded in rtf clipboard.
		 * @returns {String/null} return.Object.type String represent type of image, allowed values: 'image/png', 'image/jpeg' or `null`
		 */
		extractImagesFromRtf: function( rtfClipboard ) {
			var images = [],
				rePicture = /(?:\{\\\*\\shppict[\s\S]+?{\\\*\\blipuid\s+[0-9a-f]+\}\s?)([0-9a-f\s]+)\}\}/g,
				rePictureHeader = /\{\\\*\\shppict[\s\S]+?{\\\*\\blipuid\s+[0-9a-f]+\}\s?/,
				wholeImage,
				imageType;

			wholeImage = rtfClipboard.match( rePicture );
			if ( !wholeImage ) {
				return;
			}

			for ( var i = 0, len = wholeImage.length; i < len; i++ ) {
				if ( wholeImage[ i ].indexOf( '\\pngblip' ) !== -1 ) {
					imageType = 'image/png';
				} else if ( wholeImage[ i ].indexOf( '\\jpegblip' ) !== -1 ) {
					imageType = 'image/jpeg';
				} else {
					imageType = null;
				}

				images.push( {
					hex: imageType ? wholeImage[ i ].replace( rePictureHeader, '' ).replace( /\s/g, '' ).replace( /\}\}/, '' ) : null,
					type: imageType
				} );
			}

			return images;
		},

		/**
		 * Method extracts array of img tags.
		 *
		 * @private
		 * @since 4.8.0
		 * @param {String} htmlString String represent HTML code.
		 * @returns {Array} Array of arrays represent img tags found in `dataValue`.
		 * @returns {Array} return.Array Single result of `regexp.exec`, which finds img tags.
		 */
		extractImgTagsFromHtmlString: function( htmlString ) {
			var regexp = /<img[^>]+src="([^"]+)/g,
				ret = [];

			do {
				ret.push( regexp.exec( htmlString ) );
			} while ( ret[ ret.length - 1 ] );

			// Remove null.
			ret.pop();

			return ret;
		}
	};
} )();
