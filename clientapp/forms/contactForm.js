var _ = require('underscore');


exports.getSpec = function (model) {
    return {
        fields: [
            {
                label: 'First Name',
                name: 'firstName',
                placeholder: 'Zack',
                id: 'firstName',
                required: true,
                tests: []
            },
            {
                label: 'Middle Name',
                name: 'middleName',
                placeholder: 'Phee',
                id: 'middleName',
                tests: []
            },
            {
                label: 'Last Name',
                name: 'lastName',
                placeholder: 'McGhee',
                id: 'lastName',
                required: true,
                tests: []
            },
            {
                label: 'Company',
                name: 'company',
                placeholder: 'Apple Inc.',
                id: 'nickname',
                tests: []
            },
            {
                label: 'Title',
                name: 'title',
                placeholder: 'Biz Dev',
                id: 'title',
                tests: []
            },
            {
                label: 'Work Phone',
                name: 'workPhone',
                placeholder: '(555) 555-5555',
                id: 'workPhone',
                tests: []
            },
            {
                label: 'Home Phone',
                name: 'homePhone',
                placeholder: '(555) 555-5555',
                id: 'homePhone',
                tests: []
            },
            {
                label: 'Email',
                name: 'email',
                placeholder: 'zack@apple.com',
                id: 'email',
                tests: []
            },
            {
                label: 'Video JID',
                name: 'videoJid',
                placeholder: 'someone@voxeolabs.p1.im',
                id: 'videoJid',
                tests: []
            }
        ],
        clean: function (vals) {
            var res = {
                    name: {
                        familyName: vals.lastName || '',
                        givenName: vals.firstName || '',
                        middleName: vals.middleName || ''
                    },
                    organizations: [],
                    addresses: [],
                    phoneNumbers: [],
                    ims: []
                },
                current = app.currentPage.model;

            if (vals.company) {
                res.organizations.push({
                    name: vals.company,
                    title: vals.title
                });
            }

            if (vals.street) {
                res.addresses.push({
                    street: vals.street,
                    location: 'home'
                });
            }

            if (vals.email) {
                var emailId = current && current.getEmail('home') && current.getEmail('home').deviceid,
                    emailRes = {
                        value: vals.email,
                        type: 'home'
                    };
                if (emailId) emailRes.id = emailId;
                res.emails = [emailRes];
            }

            var workPhone = current && current.getPhone('work');
                
            if (workPhone) {
                res.phoneNumbers.push({
                    value: vals.workPhone,
                    id: workPhone.deviceid,
                    type: 'work'
                });
            } else {
                if (vals.workPhone) {
                    res.phoneNumbers.push({
                        value: vals.workPhone,
                        type: 'work'
                    });
                }
            }

            var homePhone = current && current.getPhone('home');
            
            if (homePhone) {
                res.phoneNumbers.push({
                    value: vals.homePhone,
                    id: homePhone.deviceid,
                    type: 'home'
                });
            } else {
                if (vals.homePhone) {
                    res.phoneNumbers.push({
                        value: vals.homePhone,
                        type: 'work'
                    });
                }
            }
            
            if (vals.videoJid) {
                var imRes;
                // hack for getting the device ID in there
                try {
                    imRes = app.currentPage.model.attributes.ims[0];
                } catch (e) {}

                if (imRes) {
                    res.ims.push({
                        id: imRes.deviceid,
                        value: vals.videoJid,
                        type: 'aim'
                    });
                } else {
                    res.ims.push({
                        type: 'aim',
                        value: vals.videoJid
                    });
                }
            }

            return res;
        }
    };
};