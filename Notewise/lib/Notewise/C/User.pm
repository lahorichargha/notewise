package Notewise::C::User;

use strict;
use base 'Catalyst::Base';
use LWP::UserAgent;
use HTTP::Request::Common;
use Data::FormValidator::Constraints qw(:closures);

=head1 NAME

Notewise::C::User - Scaffolding Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Scaffolding Controller Component.

=head1 METHODS

=over 4

=cut

sub login : Local {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'User/login.tt';
}

sub home : Local {
    my ( $self, $c, $username ) = @_;
    my $user = $c->model('DBIC::User')->search(username=>lc($username))->first;
    unless($user->id == $c->user->user->id){
        # TODO - need to make a different version for the public
        return $c->res->output("Sorry, you don't have permission to look at that user's homepage");
    }
    $c->stash->{user}=$user;
    $c->stash->{lastviewed}=[$c->model('DBIC::Kernel')->most_recently_viewed_kernel($user->id,15)];
    $c->stash->{lastcreated}=[$c->model('DBIC::Kernel')->most_recently_created_kernel($user->id,15)];
    $c->stash->{template} = 'User/home.tt';
}

sub bug_report : Local {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'User/bug_report.tt';
}

sub do_bug_report : Local {
    my ( $self, $c ) = @_;
    $c->form( required => [ 'summary', 'description' ] );
    if ($c->form->has_missing) {
        $c->stash->{message}="Please fill in both fields";
        return $c->forward('bug_report');
    }

    # submit the bug
    my $ua = LWP::UserAgent->new;
    my $req = (POST 'http://admin.notewise.com/trac/newticket',{
        reporter => $c->user->user->username,
        summary => $c->req->params->{summary},
        description => $c->req->params->{description},
        type => 'defect',
        action => 'create',
        status => 'new',
        priority => 'major',
        component => 'general',
    });

    $req->authorization_basic($c->config->{bug_username},$c->config->{bug_password});
    my $res = $ua->request($req);

    # debuug
    #$c->res->output($res->as_string);

    $c->stash->{template} = 'User/bug_thanks.tt';
}

sub settings : Local {
    my ( $self, $c) = @_;
    $c->stash->{template} = 'User/settings.tt';
}

sub change_password : Local {
    my ( $self, $c) = @_;
    $c->form( required => [ qw(oldpassword newpassword newpasswordagain) ],
              constraint_methods => {
                  newpassword => {
                      constraint => sub { return $_[1] eq $_[2]; },
                      params => [ qw(newpassword newpasswordagain) ]
                  }
              }
            );

    if ($c->form->has_missing) {
        $c->stash->{message}="Please fill in all required fields";
        return $c->forward('settings');
    }
    if ($c->form->has_invalid) {
        $c->stash->{message}="Sorry, the new passwords didn't match";
        return $c->forward('settings');
    }
    if (!$c->user->user->check_password($c->form->valid('oldpassword'))) {
        $c->stash->{message}="Sorry, your old password didn't match";
        return $c->forward('settings');
    }

    $c->user->user->password($c->form->valid('newpassword'));
    $c->user->user->update;

    $c->stash->{'message'} = "Your password has successfully been changed.";
    $c->forward('settings');
}

sub calendar : Local {
    my ( $self, $c, $order ) = @_;

    if ($order eq 'created') {
    } elsif ($order eq 'viewed') {
      $order = 'lastViewed';
    } elsif ($order eq 'modified') {
      $order = 'lastModified';
    } else {
      $order = 'created';
    }

    warn "****************order: $order";

    my @kernels = $c->model('DBIC::Kernel')->search({'object_id.user'=>$c->user_object->id},{join => 'object_id', order_by=>"$order DESC"});
    my %kernels;
    my @dates;
    foreach my $kernel (@kernels){
        my $date = $kernel->$order->mdy;
        unless($kernels{$date}){
            $kernels{$date} = [];
            push @dates, $date;
        }
        push @{$kernels{$date}}, $kernel;
    }
    $c->stash->{kernels} = \%kernels;
    $c->stash->{dates} = \@dates;
    $c->stash->{template} = 'User/calendar.tt';
}

sub sandbox : Local {
    my ( $self, $c ) = @_;
    my $sandbox = $c->model('DBIC::ObjectId')->search({type=>'sandbox',user=>$c->user->user->id})->first;
    unless ($sandbox){
        $c->res->status(404);
        return $c->res->output("Sorry, your sandbox doesn't seem to exist.");
    }
    my @kernels = $c->model('DBIC::ContainedObject')->search(container_object=>$sandbox->id);
    my @notes = $c->model('DBIC::Note')->search(container_object=>$sandbox->id);
    $c->stash->{sandbox}=$sandbox;
    $c->stash->{kernels}=\@kernels;
    $c->stash->{notes}=\@notes;
    $c->stash->{template}='Kernel/sandbox.tt';
}

sub start_trial : Local {
    my ( $self, $c ) = @_;

    # XXX this might fail with a race condition on super high volume
    # create new trial user
    my $user = $c->model('DBIC::User')->create({
        username=>'trialtemp',
        email=>'trialtemp@notewise.com',
        password=>'sup3rs3kr3t',
        name=>'',
        user_type=>$c->model('DBIC::UserType')->search(name=>'unregistered_trial_user')->first,
    });
    $user->username('trial'.$user->id);
    $user->email('trial'.$user->id.'@notewise.com');
    $user->update;

    # log user in as trial user
    my $auth_user = $c->get_user($user->username);
    $c->set_authenticated($auth_user);

    # TODO give them a persistent cookie

    # redirect them to first kernel
    my $kernel = $c->model('DBIC::ObjectId')->search({user=>$user->id,type=>'kernel'})->next->object;
    return $c->res->redirect($c->req->base . $kernel->relative_url);
}

sub register : Local {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'User/register.tt';
}

sub do_register : Local {
    my ( $self, $c ) = @_;
    use Data::Dumper;
    $c->form(
        required => [ qw(username email password password2) ],
        constraint_methods => {
            email => Data::FormValidator::Constraints::email(),
            password => [
                {
                    constraint_method => qr/^.{5,}/,
                    name => 'password_length'
                },
                {
                    constraint_method => sub {
                        my ($self, $pw, $pw2) = @_;
                        return $pw eq $pw2;
                    },
                    params => [ qw( password password2 ) ],
                    name=> 'password_match',
                }
            ]
        },
    );

    if ($c->form->has_missing) {
        $c->stash->{message}="Please fill in all fields";
        return $c->forward('register');
    }
    if ($c->form->has_invalid) {
        my %invalid = %{scalar $c->form->invalid};
        if(grep /^password_match$/, @{$invalid{password}}){
            $c->stash->{message}="Sorry, the passwords didn't match";
        } elsif(grep /^password_length$/, @{$invalid{password}}){
            $c->stash->{message}="Sorry, your password must be 5 characters or more";
        } elsif($invalid{email}){
            $c->stash->{message}="Sorry, the email you gave is invalid";
        }
        return $c->forward('register');
    }
    if ($c->model('DBIC::User')->count({username=>$c->req->params->{username}})) {
        $c->stash->{message}="Sorry, that username is already taken.";
        return $c->forward('register');
    }

    my $user = $c->user->user;

    if($user->user_type->name ne 'unregistered_trial_user'){
        $c->stash->{message}="It appears you've already registered.  No need to do it again.";
        return $c->forward('register');
    }
    $user->update_from_form($c->form);
    $user->user_type($c->model('DBIC::UserType')->search(name=>'trial_user')->first);
    $user->update;

    # relogin
    my $auth_user = $c->get_user($user->username);
    $c->set_authenticated($auth_user);

    ($c->stash->{last_kernel})=$c->model('DBIC::Kernel')->most_recently_viewed_kernel($user->id,1);
    $c->stash->{template}='User/registration_thankyou.tt';
}

1;
