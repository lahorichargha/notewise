package Notewise::C::Admin::Account;

use strict;
use base 'Catalyst::Base';

=head1 NAME

Notewise::C::Admin::Account - Scaffolding Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Scaffolding Controller Component.

=head1 METHODS

=over 4

=item add

Sets a template.

=cut

sub add : Local {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'Admin-Account/add.tt';
}

=item default

Forwards to list.

=cut

sub default : Private {
    my ( $self, $c ) = @_;
    $c->forward('list');
}

=item delete

Confirms a delete.

=cut

sub delete : Local {
    my ( $self, $c, $id ) = @_;
    $c->stash->{user} = $c->model('DBIC::User')->find($id);
    $c->stash->{template} = 'Admin-Account/delete.tt';
}

=item do_delete

Deletes a row and forwards to list.

=cut

sub do_delete : Local {
    my ( $self, $c, $id ) = @_;
    $c->model('DBIC::User')->find($id)->delete;
    $c->res->redirect($c->req->base . 'admin/account/');
}

=item clear

Confirms a clear.

=cut

sub clear : Local {
    my ( $self, $c, $id ) = @_;
    $c->stash->{user} = $c->model('DBIC::User')->find($id);
    $c->stash->{template} = 'Admin-Account/clear.tt';
}

=item do_clear

Clears the kernels, notes, and relationships for a user.

=cut

sub do_clear : Local {
    my ( $self, $c, $id ) = @_;
    my $user = $c->model('DBIC::User')->find($id);
    $user->clear;
    my $kernel = $c->model('DBIC::Kernel')->insert({name=>'',
                                                    user=>$user});
    $c->res->redirect($c->req->base . 'admin/account/');
}

=item do_add

Adds a new row to the table and forwards to list.

=cut

sub do_add : Local {
    my ( $self, $c ) = @_;
    $c->req->params->{user_type} = 2;
    $c->form( required => [ qw(email password name username confirm_password user_type) ] );
    if ($c->form->has_missing) {
        $c->stash->{message}='You have to fill in all fields. '.
        'The following are missing: <b>'.
        join(', ',$c->form->missing()).'</b>';
    } elsif ($c->form->has_invalid) {
        $c->stash->{message}='Some fields are correctly filled in. '.
        'The following are invalid: <b>'.
	join(', ',$c->form->invalid()).'</b>';
    } elsif ($c->req->params->{password} ne $c->req->params->{confirm_password}) {
        $c->stash->{message}="Sorry, those passwords don't match";
    } else {
	my $user = $c->model('DBIC::User')->create_from_form( $c->form );
        return $c->res->redirect($c->req->base . 'admin/account/list');
    }
    return $c->forward('add');
}

=item do_edit

Edits a row and forwards to edit.

=cut

sub do_edit : Local {
    my ( $self, $c, $id ) = @_;
    $c->form( optional => [ $c->model('DBIC::User')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->stash->{message}='You have to fill in all fields.'.
        'the following are missing: <b>'.
        join(', ',$c->form->missing()).'</b>';
    } elsif ($c->form->has_invalid) {
        $c->stash->{message}='Some fields are correctly filled in.'.
        'the following are invalid: <b>'.
	join(', ',$c->form->invalid()).'</b>';
    } elsif ($c->req->params->{password} ne $c->req->params->{confirm_password}) {
        $c->stash->{message}="Sorry, those passwords don't match";
    } else {
        my $user = $c->model('DBIC::User')->find($id);
        $user->update_from_form( $c->form );
	$c->stash->{message}='Updated OK';
    }
    $c->forward('edit');
}

=item edit

Sets a template.

=cut

sub edit : Local {
    my ( $self, $c, $id ) = @_;
    $c->stash->{item} = $c->model('DBIC::User')->find($id);
    $c->stash->{user_types} = [$c->model('DBIC::UserType')->all];
    $c->stash->{template} = 'Admin-Account/edit.tt';
}

=item list

Sets a template.

=cut

sub list : Local {
    my ( $self, $c ) = @_;
    $c->stash->{users} = [ $c->model('DBIC::User')->all ];
    $c->stash->{template} = 'Admin-Account/list.tt';
}

sub peek : Local {
    my ( $self, $c, $id ) = @_;
    my $user = $c->model('DBIC::User')->find($id);
    my $username = $user->username;
    my $auth_user = $c->get_user($user->username);
    $c->set_authenticated($auth_user);
    $c->session->{dont_set_view_timestamps} = 1;
    return $c->res->redirect($c->uri_for("/$username"));
}

=back

=head1 AUTHOR

Scotty Allen

=cut

1;
