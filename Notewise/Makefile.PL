use inc::Module::Install;

requires( perl => 5.005 );

name('Notewise');
abstract('Catalyst Application');
author('Scotty Allen');
version_from('lib/Notewise.pm');

install_script( glob('scripts/*.pl') );
&WriteAll;

