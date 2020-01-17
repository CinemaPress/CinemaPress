<?php
/*
=====================================================
 Script export data from DLE to CinemaPress
-----------------------------------------------------
 https://cinemapress.io/
-----------------------------------------------------
 Copyright (c) 2020 CinemaPress
=====================================================
 This code is protected by copyright
=====================================================
 File: cinemapress.php
-----------------------------------------------------
 Use: Script export data
=====================================================
*/

@error_reporting ( E_ALL ^ E_WARNING ^ E_DEPRECATED ^ E_NOTICE );
@ini_set ( 'error_reporting', E_ALL ^ E_WARNING ^ E_DEPRECATED ^ E_NOTICE );

@ini_set ( 'display_errors', true );
@ini_set ( 'html_errors', false );

define('DATALIFEENGINE', true);
define('ROOT_DIR', dirname (__FILE__));
define('ENGINE_DIR', ROOT_DIR.'/engine');

require_once (ENGINE_DIR . '/classes/plugins.class.php');
require_once (DLEPlugins::Check(ENGINE_DIR.'/inc/include/functions.inc.php'));

date_default_timezone_set ( $config['date_adjust'] );

header("Content-type: text/html; charset=utf-8");

if ($_REQUEST['domain'] != 'example.com') {
    die( "Wrong domain!" );
}

if ( !$db->connect(DBUSER, DBPASS, DBNAME, DBHOST, false) ) {
    die("Невозможно соединиться с MySQL сервером по указанным доступам. Введите корректные данные доступа для соединения с БД MySQL. У вас возникла ошибка:<br><br>".$db->query_errors_list[0]['error']);
}

$output = '<?xml version="1.0" encoding="UTF-8"?><sphinx:docset xmlns:sphinx="http://sphinxsearch.com/">';

$db->query( "SELECT * FROM " . PREFIX . "_post ORDER BY date ASC" );
while ( $row = $db->get_row() ) {
    $output .= '<sphinx:document id="' . $row['id'] . '">';
    $movie = array();
    $movie['title_ru'] = $row['title'];
    $movie['search'] = $row['title'];
    $movie['description'] = $row['full_story'];
    $movie['title_page'] = $row['metatitle'];
    $movie['description_short'] = $row['short_story'];
    $movie['premiere'] = (int) (strtotime($row['date']) / (60 * 60 * 24) + 719528);
    $movie['country'] = '_empty';
    $movie['director'] = '_empty';
    $movie['genre'] = '_empty';
    $movie['actor'] = '_empty';
    $movie['type'] = '0';
    $movie['pictures'] = '';
    $movie['player'] = '';
    $movie['custom'] = '';
    $movie['rating'] = '0';
    $movie['vote'] = '0';
    $movie['all_movies'] = '_' . preg_replace('/[^a-z0-9]+/i', '_', $_REQUEST['domain']) . '_';
    if ($row['xfields']) {
        $xfields = preg_split("/\|\|/", $row['xfields']);
        foreach ($xfields as $xfield) {
            $xf = preg_split("/\|/", $xfield); $key = $xf[0]; $value = $xf[1];
            if ($key == 'kinopoisk_id' || $key == 'kp_id' || $key == 'id_kinopoisk' || $key == 'id_kp' || $key == 'kinopoisk') {
                $movie['kp_id'] = preg_replace('/[^0-9]+/i', '', $value);
                $movie['query_id'] = preg_replace('/[^0-9]+/i', '', $value);
            } elseif ($key == 'poster') {
                $movie['poster'] = $value;
            } elseif ($key == 'world_title' || $key == 'title_en' || $key == 'english_title') {
                $movie['title_en'] = $value;
            } elseif ($key == 'actors' || $key == 'actor' || $key == 'cast') {
                $movie['actor'] = preg_replace('/,\s*/i', ',', $value);
            } elseif ($key == 'directors' || $key == 'director') {
                $movie['director'] = preg_replace('/,\s*/i', ',', $value);
            } elseif ($key == 'countries' || $key == 'country') {
                $movie['country'] = preg_replace('/,\s*/i', ',', $value);
            } elseif ($key == 'genres' || $key == 'genre') {
                $movie['genre'] = preg_replace('/,\s*/i', ',', $value);
            } elseif ($key == 'year') {
                $movie['year'] = preg_replace('/[^0-9]+/i', '', $value);
            } elseif ($key == 'kinopoisk_rating' || $key == 'kp_rating') {
                $movie['kp_rating'] = round((float) $value * 10);
            } elseif ($key == 'kinopoisk_votes' || $key == 'kp_votes' || $key == 'kinopoisk_vote' || $key == 'kp_vote') {
                $movie['kp_vote'] = preg_replace('/[^0-9]+/i', '', $value);
            } elseif ($key == 'imdb_rating') {
                $movie['imdb_rating'] = round((float) $value * 10);
            } elseif ($key == 'imdb_votes' || $key == 'imdb_vote') {
                $movie['imdb_vote'] = preg_replace('/[^0-9]+/i', '', $value);
            } elseif ($key == 'world_title' || $key == 'title_en' || $key == 'english_title') {
                $movie['title_en'] = $value;
            } elseif ($key == 'quality') {
                $movie['quality'] = $value;
            } elseif ($key == 'translator' || $key == 'translate' || $key == 'voice') {
                $movie['translate'] = $value;
            }
        }
    }
    foreach($movie AS $key => $value){
        $output .= '<' . $key . '><![CDATA[' . $value . ']]></' . $key . '>';
    }
    $output .= '</sphinx:document>';
}

$output .= '</sphinx:docset>';

$xml_file = fopen("uploads/files/" . $_REQUEST['domain'] . ".xml", "w+") or die("Извините, но невозможно создать файл <b>.uploads/files/" . $_REQUEST['domain'] . ".xml</b>.<br />Проверьте правильность проставленного CHMOD!");
fwrite($xml_file, $output);
fclose($xml_file);

die('ok');