var t = {};

var words =
    [
      'cheshki',
      'cheshka',
      'чешка',
      'чешки',
      'gym shoe',
      'чеш ка',
      'б',
      'б)',
      'вася, петя',
      'маша|дима'
    ];

var RE = buildRE(words);

console.log(RE);

var t0 = RE.test(words.join(' '));

console.log(['t0', t0, words.join(' ') ]);

for (var i=0; i<words.length; i++)
{
  t['t'+(i+1)+'-1'] = RE.test(words[i]);
  console.log(['t'+(i+1)+'-1', t['t'+(i+1)+'-1'], words[i] ]);

  t['t'+(i+1)+'-2'] = RE.test('  ' + words[i] + '  ');
  console.log(['t'+(i+1)+'-2', t['t'+(i+1)+'-2'], '  ' + words[i] + '  ' ]);

  t['t'+(i+1)+'-3'] = RE.test('zz' + words[i] + 'zz');
  console.log(['t'+(i+1)+'-3', t['t'+(i+1)+'-3'], 'zz' + words[i] + 'zz' ]);

  t['t'+(i+1)+'-4'] = RE.test(' ' + words[i] + 'zz');
  console.log(['t'+(i+1)+'-4', t['t'+(i+1)+'-4'], ' ' + words[i] + 'zz' ]);

  t['t'+(i+1)+'-5'] = RE.test('zz' + words[i] + '  ');
  console.log(['t'+(i+1)+'-5', t['t'+(i+1)+'-5'], 'zz' + words[i] + '  ' ]);

  t['t'+(i+1)+'-6'] = RE.test('zz ' + words[i] + ' zz');
  console.log(['t'+(i+1)+'-6', t['t'+(i+1)+'-6'], 'zz ' + words[i] + ' zz' ]);

  t['t'+(i+1)+'-7'] = RE.test(words[i].substr(0, Math.floor(words[i].length/2)));
  console.log(['t'+(i+1)+'-7', t['t'+(i+1)+'-7'], words[i].substr(0, Math.floor(words[i].length/2)) ]);

  t['t'+(i+1)+'-8'] = RE.test(words[i].substr(Math.floor(words[i].length/2)));
  console.log(['t'+(i+1)+'-8', t['t'+(i+1)+'-8'], words[i].substr(Math.floor(words[i].length/2)) ]);

  t['t'+(i+1)+'-9'] = RE.test(words[i].substr(0, Math.floor(words[i].length/2)) + 'ZZ' + words[i].substr(Math.floor(words[i].length/2)));
  console.log(['t'+(i+1)+'-9', t['t'+(i+1)+'-9'], words[i].substr(0, Math.floor(words[i].length/2)) + 'ZZ' + words[i].substr(Math.floor(words[i].length/2)) ]);

  t['t'+(i+1)+'-10'] = RE.test(words[i].replace(/( )/g, '   $1   '));
  console.log(['t'+(i+1)+'-10', t['t'+(i+1)+'-10'], words[i].replace(/( )/g, '   $1   ') ]);


  console.log(' ');
}


function buildRE(list)
{
  var i, j, word, code, result = [];

  for (i=0; i<list.length; i++)
  {
    word = list[i].split('');

    for (j=0; j<word.length; j++)
    {
      switch (code = word[j].charCodeAt())
      {
        case 32:
          word[j] = '\\s+';
          break;

        default:
          word[j] = '\\u' + padLeft((+code).toString(16), 4);
      }
    }

    result[i] = word.join('');
  }

  return new RegExp('('+result.join('|')+')');
}

function padLeft(number, length, fill)
{
  var str = ''+number;

  // defaults
  length = length || 2;
  fill   = fill || '0';

  while (str.length < length)
  {
    str = fill + str;
  }

  return str;
}
