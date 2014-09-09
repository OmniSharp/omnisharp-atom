module.exports = (grunt) ->

    grunt.initConfig

        meta:
            src: 'lib/**/*.coffee',
<<<<<<< HEAD
            src1: 'lib/**/*.js'
            specs: 'spec/**/*.spec.js'

        watch:
            codegen:
                files: ['<%= meta.src %>']
                tasks: ['coffee']

=======
            specs: 'spec/**/*.spec.js'

        watch:
>>>>>>> origin/master
            quality:
                files: [
                    '<%= meta.src %>'
                ]
                tasks: ['coffeelint']

        coffeelint:
            app: [
              'app/*.coffee'
              'scripts/*.coffee'
            ]

<<<<<<< HEAD
        jshint:
            options:
                curly: true
                bitwise: true
                eqeqeq: true
                immed: true
                latedef: true
                newcap: true
                noarg: true
                noempty: true
                sub: true
                undef: true
                unused: true
                strict: true
                eqnull: true
                browser: true
                laxcomma: false
                maxparams: 5
                maxstatements: 20
            globals:
                require: true
                define: true
                requirejs: true
                describe: true
                expect: true
                it: true
                beforeEach: true
                afterEach: true
                jasmine: true
                angular: true
                module: true
                inject: true
                spyOn: true

            src: [
                'GruntFile.js'
                '<%= meta.src %>'
                '<%= meta.specs %>'
            ]

        coffee:
            compile:
                expand: true
                flatten: false
                cwd: 'lib'
                src: ['**/*.coffee']
                dest: 'lib'
                ext: '.js'

    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-jshint'
=======
    grunt.loadNpmTasks 'grunt-contrib-watch'
>>>>>>> origin/master
    grunt.loadNpmTasks 'grunt-coffeelint'

    grunt.registerTask 'default', ['watch']

    return
