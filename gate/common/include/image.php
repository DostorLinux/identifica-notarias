<?php

function image_restrict_size($image_file, $image, $max_size) {
    list($width, $height) = getimagesize($image_file);
    error_log("image size $width x $height");
    if ($width <= $max_size && $height <= $max_size) {
        return $image;
    }

    $ratio = $width / $height;
    if ($ratio >= 1) {
        $new_width  = $max_size;
        $new_height = (int)($max_size / $ratio);
    } else {
        $new_height = $max_size;
        $new_width  = (int)($ratio * $max_size);
    }

    error_log("image resize $width x $height -> $new_width x $new_height ($ratio aspect ratio)");

    $new_image = imagecreatetruecolor($new_width, $new_height);
    imagecopyresampled($new_image, $image,
        0, 0, 0, 0,
        $new_width, $new_height,
        $width, $height);
    return $new_image;
}

function image_rotate_from_exif($image_file, $image) {
    $exif = exif_read_data($image_file);
    if ($image && $exif && isset($exif['Orientation'])) {
        $ort = $exif['Orientation'];

        if ($ort == 6 || $ort == 5)
            $image = imagerotate($image, 270, null);
        if ($ort == 3 || $ort == 4)
            $image = imagerotate($image, 180, null);
        if ($ort == 8 || $ort == 7)
            $image = imagerotate($image, 90, null);

        if ($ort == 5 || $ort == 4 || $ort == 7)
            imageflip($image, IMG_FLIP_HORIZONTAL);
    }
    return $image;
}

?>