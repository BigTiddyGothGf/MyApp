/**
 * ImageUpload Class.
 * 
 * Saves files to '/public/img/' directory
 *
 * @class
 *
 */
class ImageUpload{

    /**
     * Writes renamed image to img directory
     * 
     * @param {Object}      image       Image from POST files submission
     * @param {string}      newName     New image name with salt using id
     * 
     * @return {boolean}    valid filename boolean and either upload error or new file path
     */
    uploadImage(image, newName) {
        let result = '';
        var extensions = ["png", "jpg", "jpeg", "gif"];
		// Check if file ia an allowed type
        var validExtension = this.allowedFile(image.name, extensions);
        if (validExtension) {
			// Upload valid file and return relative filepath
            var newImageLocation = '/img/' + newName  + '.' + validExtension;
            image.mv('./public' + newImageLocation);
            result = newImageLocation;
        } else {
			// Filetype not allowed, so return list of allowed types
            result = "Only allowed filetypes: " + extensions.join(' ');
        }
        return { result, validExtension };
    }

    /**
     * Checks if filetype is allowed
     * 
     * @param {string}      filename        Filename including extension
     * @param {array}       extensions      Allowed file upload extensions
     * 
     * @return {mixed}      valid filename extension or false if not valid
     */
    allowedFile(filename, extensions){
        var extExists = extensions.includes(filename.split('.').pop());
        if (extExists) {
            return filename.split('.').pop();
        }
        return false;
    }
}
module.exports = ImageUpload;