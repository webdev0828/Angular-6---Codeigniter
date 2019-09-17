<?php 
function getRestApiHeaders(){
	$headers = array();
    $headers[] = getenv('HEADER_ACCEPT');
    $headers[] = getenv('HEADER_USERNAME');
    $headers[] = getenv('HEADER_PASSWORD');
    $headers[] = getenv('HEADER_REFERER');
    return $headers;
}