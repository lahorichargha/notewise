package Notewise::C::Kernel;

use strict;
use base 'Catalyst::Base';
use URI::Escape;

=head1 NAME

Notewise::C::Kernel - Scaffolding Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Scaffolding Controller Component.

=head1 METHODS

=over 4

=cut

=item add

Creates a kernel

=cut

sub add : Local {
    my ( $self, $c ) = @_;
    $c->form( optional => [ $c->model('DBIC::Kernel')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->stash->{message}='You have to fill in all fields. '.
        'The following are missing: <b>'.
        join(', ',$c->form->missing()).'</b>';
    } elsif ($c->form->has_invalid) {
        $c->stash->{message}='Some fields are correctly filled in. '.
        'The following are invalid: <b>'.
	join(', ',$c->form->invalid()).'</b>';
    } else {
	my $kernel = $c->model('DBIC::Kernel')->create_from_form( $c->form );
        $kernel->user($c->user->obj->id);
        $kernel->update;
        # this is necessary so that V::TT doesn't kick in, which it does if there's no output
        $c->res->output(' ');
        return $c->res->redirect($c->req->base.$kernel->relative_url);
    }
}

=item view

Displays the given kernel

=cut

sub view : Private {
    my ( $self, $c, $username, $name, $id ) = @_;
    if ($id){
        my $kernel = $c->model('DBIC::Kernel')->find($id,{prefetch=> {object_id => 'user'}});
        if($kernel->user->username ne $username){
            return $c->res->output("Couldn't find a kernel by that name.");
        }
        $c->stash->{kernel} = $kernel;
        $c->forward('view_kernel');
    } elsif ($name ne '') {
        $name =~ s/_/ /g;
        $name = uri_unescape($name);
        warn "username: $username";
        my $user = $c->model('DBIC::User')->search({username=>$username})->first;
        my @kernels = $c->model('DBIC::Kernel')->kernels_with_name($name,$user->id);
        my @allowed_kernels = grep $_->has_permission($c->user->obj->id,'view'), @kernels;
        if(@allowed_kernels == 1){
            $c->stash->{kernel} = $kernels[0];
            return $c->forward('view_kernel');
        } elsif (@allowed_kernels > 1) {
            $c->stash->{kernels} = \@kernels;
            $c->stash->{template} = 'Kernel/disambiguation.tt';
        } elsif (@kernels > 0) {
            # TODO make this look prettier
            $c->res->status(403);
            return $c->res->output("Sorry, you don't have permission to view that kernel.");
        } else {
            $c->res->status(404);
            # TODO make this look prettier
            return $c->res->output("Couldn't find a kernel by that name.");
        }
    } else {
        die "We shouldn't have gotten here - no kernel name or id";
    }
}

sub view_kernel : Private {
    my ( $self, $c ) = @_;
    my $kernel = $c->stash->{kernel};
    unless ($kernel){
        $c->res->status(404);
        return $c->res->output("Sorry, that kernel doesn't seem to exist.");
    }
    unless ($kernel->has_permission($c->user->obj->id,'view')){
        $c->res->status(403); # Forbidden
        #TODO make this screen prettier
        return $c->res->output('You do not have access to this kernel');
    }
    if($kernel->user->id == $c->user->obj->id){
        if (!$c->session->{dont_set_view_timestamps}) {
            $kernel->lastViewed(DateTime->now());
        }
        $kernel->update();
    }
    $c->res->redirect($c->req->base . "notewise#".$kernel->get_column('object_id'));
}

sub interface : Path('/notewise') {
    my ( $self, $c ) = @_;
    ($c->stash->{lastviewed})=$c->model('DBIC::Kernel')->most_recently_viewed_kernel($c->user_object->id,1);
    $c->stash->{sandbox} = $c->model('DBIC::ObjectId')->search({type=>'sandbox',user=>$c->user->obj->id})->first;
    $c->stash->{user_type} = $c->user_object->user_type->name;
    $c->stash->{template} = 'Kernel/view.tt';
}

sub innerhtml : Local {
    my ( $self, $c, $id ) = @_;
    $c->stash->{kernel} = $c->model('DBIC::Kernel')->find($id);
    $c->stash->{template} = 'Kernel/kernel-innerhtml.tt';
}

sub delete : Local {
    my ( $self, $c, $id ) = @_;
    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->res->status(404);
        return $c->res->output('Sorry, it looks like that kernel was already deleted');
    }
    unless($kernel->has_permission($c->user->obj->id,'delete')){
        $c->res->status(403); # Forbidden
        #TODO make this screen prettier
        return $c->res->output('You do not have access to delete this kernel');
    }
    $kernel->delete;

    # get the most recently viewed kernel
    my ($lastviewed)=$c->model('DBIC::Kernel')->most_recently_viewed_kernel($c->user->obj->id,1);

    $c->res->redirect($c->req->base . $lastviewed->relative_url);
}

sub parentshtml : Local {
    my ( $self, $c, $id ) = @_;
    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->res->status(404);
        return $c->res->output("That kernel doesn't exist");
    }
    unless($kernel->has_permission($c->user->obj->id,'delete')){
        $c->res->status(403); # Forbidden
        return $c->res->output('You do not have permission to view the parents of this kernel');
    }
    $c->stash->{kernel} = $kernel;
    $c->stash->{template} = 'Kernel/parentshtml.tt';
}

=back

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
