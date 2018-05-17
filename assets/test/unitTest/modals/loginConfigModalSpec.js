describe('LoginConfig Modal Test', () => {
    describe('Basic Function Test', () => {
        let setupConfig;

        before(() => {
            setupConfig = LoginConfigModal.__testOnly__.setupConfig;
            UnitTest.onMinMode();
        });

        describe('submitDefaultAdminConfig Test', () => {
            let submitDefaultAdminConfig;
            let oldSetConfig;
            let $adminEnabled;
            let $userName;
            let $email;
            let $password;
            let $confimPassword;
            let hasChecked;

            before(() => {
                submitDefaultAdminConfig = LoginConfigModal.__testOnly__.submitDefaultAdminConfig;
                oldSetConfig = setDefaultAdminConfig;

                $adminEnabled = $("#loginConfigEnableDefaultAdmin").find(".checkbox");
                hasChecked = $adminEnabled.hasClass("checked");

                $userName = $("#loginConfigAdminUsername");
                $email = $("#loginConfigAdminEmail");
                $password = $("#loginConfigAdminPassword");
                $confimPassword = $("#loginConfigAdminConfirmPassword");
            });

            it('should resolve if no admin config and not enabled', (done) => {
                let test = false;
                setDefaultAdminConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null);
                $adminEnabled.removeClass("checked");

                submitDefaultAdminConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should reject if password not match', (done) => {
                setupConfig(null);
                $adminEnabled.addClass("checked");
                $password.val("a");
                $confimPassword.val("b");

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal(LoginConfigTStr.PasswordMismatch);
                    expect(passCheck).to.be.false;
                    done();
                });
            });

            it('should reject if has empty password', (done) => {
                setupConfig(null, {defaultAdminEnabled: true});
                $adminEnabled.addClass("checked");
                $password.val("");
                $confimPassword.val("");

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal(LoginConfigTStr.EmptyPasswordError);
                    expect(passCheck).to.be.false;
                    done();
                });
            });

            it('should reject if has empty user', (done) => {
                $password.val("password");
                $confimPassword.val("password");
                $userName.val("");

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal(LoginConfigTStr.EmptyUsernameError);
                    expect(passCheck).to.be.false;
                    done();
                });
            });

            it('should reject if has empty email', (done) => {
                $userName.val('admin');
                $email.val('');

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal(LoginConfigTStr.EmptyEmailError);
                    expect(passCheck).to.be.false;
                    done();
                });
            });

            it('should reject if has invalid password', (done) => {
                $userName.val("admin");
                $email.val('admin@admin');

                $password.val("admin");
                $confimPassword.val("admin");

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal(LoginConfigTStr.duplicateUserName);
                    expect(passCheck).to.be.false;
                    done();
                });
            });

            it('should reject when api call is error', (done) => {
                setDefaultAdminConfig = () => PromiseHelper.reject('test');

                $password.val("strong");
                $confimPassword.val("strong");

                submitDefaultAdminConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal('test');
                    expect(passCheck).to.be.true;
                    done();
                });
            });

            it('should resolve in normal case', (done) => {
                let test = false;
                setDefaultAdminConfig = () => {
                    test = true;
                    return PromiseHelper.resolve('test');
                };

                submitDefaultAdminConfig()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve when no change', (done) => {
                let test = false;
                setDefaultAdminConfig = () => {
                    test = true;
                    return PromiseHelper.resolve('test');
                };

                setupConfig(null, {
                    defaultAdminEnabled: true,
                    username: 'admin',
                    email: 'admin@admin'
                });
                $password.val("");
                $confimPassword.val("");

                submitDefaultAdminConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            after(() => {
                setDefaultAdminConfig = oldSetConfig;
                if (hasChecked) {
                    $adminEnabled.addClass("checked");
                } else {
                    $adminEnabled.removeClass("checked");
                }

                const $eles = [$userName, $email, $password, $confimPassword];
                $eles.forEach(($el) => {
                    $el.val("");
                });
            });
        });

        describe('submitMSALConfig Test', () => {
            let submitMSALConfig;
            let oldSetMSALConfig;
            let $msalEnabled;
            let hasChecked;

            before(() => {
                submitMSALConfig = LoginConfigModal.__testOnly__.submitMSALConfig;
                oldSetMSALConfig = setMSALConfig;
                $msalEnabled = $("#loginConfigEnableMSAL").find(".checkbox");
                hasChecked = $msalEnabled.hasClass('checked');
            });

            it('should resolve if msal not enabled', (done) => {
                let test = false;
                setMSALConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null);
                $msalEnabled.removeClass('checked');

                submitMSALConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve when no change', (done) => {
                let test = false;
                setMSALConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig({
                    msalEnabled: true,
                    msal: {
                        clientId: "",
                        webApi: "",
                        authority: "",
                        azureEndpoint: "",
                        azureScopes: [],
                        userScope: "",
                        adminScope: "",
                        b2cEnabled: false
                    }
                });
                $msalEnabled.addClass('checked');

                submitMSALConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve normal case', (done) => {
                let test = false;
                setMSALConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null);
                $msalEnabled.addClass('checked');

                submitMSALConfig()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve normal case 2', (done) => {
                let test = false;
                setMSALConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig({
                    msalEnabled: true,
                    msal: {
                        clientId: "",
                        webApi: "",
                        authority: "",
                        azureEndpoint: "",
                        azureScopes: ['a'],
                        userScope: "",
                        adminScope: "",
                        b2cEnabled: false
                    }
                });
                $msalEnabled.addClass('checked');

                submitMSALConfig()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve normal case 3', (done) => {
                let test = false;
                setMSALConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig({
                    msalEnabled: true,
                    msal: {
                        clientId: "test",
                        webApi: "",
                        authority: "",
                        azureEndpoint: "",
                        azureScopes: [''],
                        userScope: "",
                        adminScope: "",
                        b2cEnabled: false
                    }
                });
                $msalEnabled.addClass('checked');

                submitMSALConfig()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should reject error case', (done) => {
                setMSALConfig = () => PromiseHelper.reject('test');

                setupConfig(null);
                $msalEnabled.addClass('checked');

                submitMSALConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal('test');
                    expect(passCheck).to.be.true;
                    done();
                });
            });

            after(() => {
                setMSALConfig = oldSetMSALConfig;
                if (hasChecked) {
                    $msalEnabled.addClass("checked");
                } else {
                    $msalEnabled.removeClass("checked");
                }
            });
        });

        describe('submitLdapConfig Test', () => {
            let submitLdapConfig;
            let oldSetLdapConfig;
            let $ladpEnabled;
            let hasChecked;

            before(() => {
                submitLdapConfig = LoginConfigModal.__testOnly__.submitLdapConfig;
                oldSetLdapConfig = setLdapConfig;
                $ladpEnabled = $("#loginConfigEnableLdapAuth").find(".checkbox");
                hasChecked = $ladpEnabled.hasClass('checked');
            });

            it('should resolve if ldap not enabled', (done) => {
                let test = false;
                setLdapConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null, null, null);
                $ladpEnabled.removeClass('checked');

                submitLdapConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve when no change', (done) => {
                let test = false;
                setLdapConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null, null, {
                    ldapConfigEnabled: true,
                    ldap_uri: "",
                    userDN: "",
                    useTLS: "",
                    searchFilter: "",
                    activeDir: false,
                    serverKeyFile: "",
                    adUserGroup: "",
                    adAdminGroup: "",
                    adDomain: "",
                    adSubGroupTree: false,
                    adSearchShortName: false
                });
                $ladpEnabled.addClass('checked');

                submitLdapConfig()
                .then(() => {
                    expect(test).to.be.false;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should resolve normal case', (done) => {
                let test = false;
                setLdapConfig = () => {
                    test = true;
                    return PromiseHelper.resolve();
                };

                setupConfig(null, null, null);
                $ladpEnabled.addClass('checked');

                submitLdapConfig()
                .then(() => {
                    expect(test).to.be.true;
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });

            it('should reject error case', (done) => {
                setLdapConfig = () => PromiseHelper.reject('test');

                setupConfig(null, null, null);
                $ladpEnabled.addClass('checked');

                submitLdapConfig()
                .then(() => {
                    done('fail');
                })
                .fail((error, passCheck) => {
                    expect(error).to.equal('test');
                    expect(passCheck).to.be.true;
                    done();
                });
            });

            after(() => {
                setLdapConfig = oldSetLdapConfig;
                if (hasChecked) {
                    $ladpEnabled.addClass("checked");
                } else {
                    $ladpEnabled.removeClass("checked");
                }
            });
        });

        describe('getPasswordStrength Test', () => {
            let getPasswordStrength;
            const userName = 'testUser';

            before(() => {
                getPasswordStrength = LoginConfigModal.__testOnly__.getPasswordStrength;
            });

            it('shold detect invalid passwords', () => {
                const passwords = [userName, userName.substring(0, 4),
                    userName + 'Abc'];
                passwords.forEach((password) => {
                    const res = getPasswordStrength(password, userName);
                    expect(res).to.be.an('object');
                    expect(res.strength).to.equal('invalid');
                    expect(res.hint).to.equal(LoginConfigTStr.duplicateUserName);
                });
            });

            it('should detect illegal chars', () => {
                const password = '测试';
                const res = getPasswordStrength(password, userName);
                expect(res.strength).to.equal('invalid');
                expect(res.hint).to.equal(LoginConfigTStr.illegalCharacter);
            });

            it('should detect very weak password', () => {
                const password = 'a1';
                const res = getPasswordStrength(password, userName);
                expect(res.strength).to.equal('veryWeak');
                expect(res.hint).to.equal(LoginConfigTStr.veryWeak);
            });

            it('should detect very weak strength', () => {
                const passwords = ['a1A', 'aaa', 'abc'];
                passwords.forEach((password) => {
                    const res = getPasswordStrength(password, userName);
                    expect(res.strength).to.equal('veryWeak');
                    expect(res.hint).to.equal(LoginConfigTStr.veryWeak);
                });
            });

            it('should detect weak strength', () => {
                const passwords = ['abcABC123', 'ajkAJKDlf'];
                passwords.forEach((password) => {
                    const res = getPasswordStrength(password, userName);
                    expect(res.strength).to.equal('weak');
                    expect(res.hint).to.equal(LoginConfigTStr.weak);
                });
            });

            it('should detect strong strength', () => {
                const passwords = ['#AC1f#gdac'];
                passwords.forEach((password) => {
                    const res = getPasswordStrength(password, userName);
                    expect(res.strength).to.equal('strong');
                    expect(res.hint).to.equal(LoginConfigTStr.strong);
                });

            });

            it('should detect very strong strength', () => {
                const passwords = ['&V&e&r#y!s'];
                passwords.forEach((password) => {
                    const res = getPasswordStrength(password, userName);
                    expect(res.strength).to.equal('veryStrong');
                    expect(res.hint).to.equal(LoginConfigTStr.veryStrong);
                });
            });
        });

        describe('UI Behavior Test', () => {
            let $modal;

            before(() => {
                $modal = $("#loginConfigModal");
            });

            it('should show the modal', () => {
                const msalConfig = {
                    msalEnabled: true,
                    msal: {
                        clientId: '',
                        userScope: '',
                        adminScope: '',
                        webApi: '',
                        authority: '',
                        azureEndpoint: '',
                        azureScopes: [],
                        b2cEnabled: true
                    }
                };
                const defaultAdminConfig = {
                    defaultAdminEnabled: true,
                    username: '',
                    email: ''
                };
                const ldapConfig = {
                    ldapConfigEnabled: true,
                    ldap_uri: '',
                    userDN: '',
                    searchFilter: '',
                    serverKeyFile: '',
                    useTLS: true,
                    activeDir: true,
                    adUserGroup: '',
                    adAdminGroup: '',
                    adDomain: '',
                    adSubGroupTree: true,
                    adSearchShortName: true
                };
                LoginConfigModal.show(msalConfig, defaultAdminConfig, ldapConfig);
                assert.isTrue($modal.is(':visible'));
            });

            it('should toggle sectoin', () => {
                const $section = $("#loginConfigEnableDefaultAdmin");
                const $checkbox = $section.find('.checkbox');

                expect($checkbox.hasClass('checked')).to.be.true;
                $section.click();
                expect($checkbox.hasClass('checked')).to.be.false;
                $section.click(); // toggle back
                expect($checkbox.hasClass('checked')).to.be.true;
            });

            it('should toggle buttons', () => {
                const buttons = [$("#loginConfigEnableADGroupChain"),
                $("#loginConfigEnableADSearchShortName"),
                $("#loginConfigLdapEnableTLS"),
                $("#loginConfigMSALEnableB2C")];

                buttons.forEach(($btn) => {
                    expect($btn.hasClass('checked')).to.be.true;
                    $btn.click();
                    expect($btn.hasClass('checked')).to.be.false;
                    $btn.click(); // toggle back
                    expect($btn.hasClass('checked')).to.be.true;
                });
            });

            it('should change ad section', () => {
                const $radioButtons = $("#ldapChoice").find(".radioButton");
                const $ad = $radioButtons.filter((index, ele) => $(ele).data('option') === 'ad');
                const $ldap = $radioButtons.filter((index, ele) => $(ele).data('option') === 'ldap');
                expect($ad.hasClass('active')).to.be.true;
                expect($ldap.hasClass('active')).to.be.false;
                $ldap.click();
                expect($ad.hasClass('active')).to.be.false;
                expect($ldap.hasClass('active')).to.be.true;
                $ad.click();
                expect($ad.hasClass('active')).to.be.true;
                expect($ldap.hasClass('active')).to.be.false;
            });

            it('should check password strength when typing', () => {
                const $input = $("#loginConfigAdminPassword");
                const $hint = $('#passwordStrengthHint');
                $input.val('1').keyup();
                expect($hint.hasClass('veryWeak')).to.be.true;
                $input.val('').keyup();
                expect($hint.hasClass('veryWeak')).to.be.false;
            });

            it('should validate passwork', () => {
                const oldShow = StatusBox.show;
                const oldHide = StatusBox.forceHide;
                let t1 = false;
                let t2 = false;

                StatusBox.show = () => { t1 = true; };
                StatusBox.forceHide = () => { t2 = true; };

                const e = jQuery.Event('keyup');
                e.keyCode = keyCode.Enter;
                const $input = $("#loginConfigAdminPassword");
                $input.val('测试').trigger(e);
                expect(t1).to.be.true;
                expect(t2).to.be.false;

                t1 = false;
                $input.val('').trigger(e);
                expect(t1).to.be.false;
                expect(t2).to.be.true;

                StatusBox.forceHide = oldHide;
                StatusBox.show = oldShow;
            });

            it('should close modal', () => {
                $modal.find('.cancel').click();
                assert.isFalse($modal.is(':visible'));
            });

            it('should submit the modal', (done) => {
                $modal.find('.checked').removeClass('checked');
                setupConfig(null);

                let text = null;
                xcHelper.showSuccess = (t) => { text = t; };
                $modal.find('.confirm').click();

                UnitTest.testFinish(() => {
                    return text != null
                })
                .then(() => {
                    expect(text).to.equal(LoginConfigTStr.LoginConfigSavedSuccess);
                    done();
                })
                .fail(() => {
                    done('fail');
                });
            });
        });

        after(() => {
            setupConfig(null, null, null);
            UnitTest.offMinMode();
        });
    });
});