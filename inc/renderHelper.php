<?/**
 * Summary.
 *
 * Description.
 *
 * @since Version 3 digits
 */

function numberToLetter($letterNumber)
{

    $letterMap = [  ];

    $letterMap += [ "1" => "A" ];
    $letterMap += [ "2" => "B" ];
    $letterMap += [ "3" => "C" ];
    $letterMap += [ "4" => "D" ];
    $letterMap += [ "5" => "E" ];
    $letterMap += [ "6" => "F" ];
    $letterMap += [ "7" => "G" ];
    $letterMap += [ "8" => "H" ];
    $letterMap += [ "9" => "I" ];
    $letterMap += [ "a" => "J" ];
    $letterMap += [ "b" => "K" ];
    $letterMap += [ "c" => "L" ];
    $letterMap += [ "d" => "M" ];
    $letterMap += [ "e" => "N" ];
    $letterMap += [ "f" => "O" ];
    $letterMap += [ "g" => "P" ];
    $letterMap += [ "h" => "Q" ];
    $letterMap += [ "i" => "R" ];
    $letterMap += [ "j" => "S" ];
    $letterMap += [ "k" => "T" ];
    $letterMap += [ "l" => "U" ];
    $letterMap += [ "m" => "V" ];
    $letterMap += [ "n" => "W" ];
    $letterMap += [ "o" => "X" ];
    $letterMap += [ "p" => "Y" ];
    $letterMap += [ "q" => "Z" ];

    $letterLookup = str_split(base_convert($letterNumber, 10, 26));
    $letterDigit = '';

    foreach ($letterLookup as $letter) {
        $letterDigit .= $letterMap[ $letter ];
    }

    return $letterDigit;
}

function process_columns($columns)
{
    $newGridColumnStyle = '';

    foreach ($columns as $index => $column) {

        list('columnWidthType' => $columnWidthType,
            'minWidth' => $minWidth,
            'minWidthUnits' => $minWidthUnits,
            'maxWidth' => $maxWidth,
            'maxWidthUnits' => $maxWidthUnits,
            'fixedWidth' => $fixedWidth,
            'fixedWidthUnits' => $fixedWidthUnits,
            'disableForTablet' => $disableForTablet,
            'disableForPhone' => $disableForPhone,
            'isFixedLeftColumnGroup' => $isFixedLeftColumnGroup,
            'horizontalAlignment' => $horizontalAlignment
        ) = $column[ 'attributes' ];

        $sizing = '';

        switch ($columnWidthType) {
            case 'Proportional':
                if ($minWidth > 0) {
                    $sizing = 'minmax(' . strval($minWidth) . $minWidthUnits . ', ' . strval($maxWidth) . 'fr) ';
                } else {
                    $sizing = $maxWidth . 'fr ';
                }
                $newGridColumnStyle .= $sizing;
                break;
            case 'Auto':
                $newGridColumnStyle .= 'auto ';
                break;
            case 'Fixed':
                $newGridColumnStyle .= strval($fixedWidth) . $fixedWidthUnits . ' ';
                break;
            case 'Custom';
                $sizing = 'minmax(' . strval($minWidth) . $minWidthUnits . ', ' . strval($maxWidth) . $maxWidthUnits . ') ';
                $newGridColumnStyle .= $sizing;
                break;
        }

    }

    return $newGridColumnStyle;
}

function getCalculatedClasses($cellRowId, $cellColumnId, $bandedRows)
{
    $calculatedClasses = '';

    if ($bandedRows) {
        if ($cellRowId % 2 === 0) {
            $calculatedClasses .= 'grid-control__cells--banded-row ';
        }
    }
    return $calculatedClasses;
}
