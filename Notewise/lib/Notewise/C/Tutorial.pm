package Notewise::C::Tutorial;

use strict;
use base 'Catalyst::Base';

sub tutorial : Path {
    my ( $self, $c ) = @_;
    $c->forward('start');
}

sub start : Local {
    my ( $self, $c ) = @_;

    # create new tutorial user
    my $tutorial_template_user = $c->model('DBIC::User')->search({username=>'tutorial_template'})->first;
    my $user = $tutorial_template_user->fullcopy('tutorialtemp','tutorialtemp@notewise.com');
    $user->username('tutorial'.$user->id);
    $user->email('tutorial'.$user->id.'@notewise.com');
    $user->user_type($c->model('DBIC::UserType')->search(name=>'tutorial_user')->next);
    $user->update;

    # log user in as tutorial user
    my $auth_user = $c->get_user($user->username);
    $c->set_authenticated($auth_user);

    # redirect them to first page in tutorial
    my $username = $user->username;
    return $c->res->redirect($c->uri_for("/$username/Start_of_tutorial"));
}

1;
