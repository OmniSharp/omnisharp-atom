buildModel = require './tasks/build-models.js'

module.exports = (grunt) ->

    grunt.initConfig

        meta:
            src: 'lib/**/*.coffee',
            specs: 'spec/**/*.spec.js'

        watch:
            quality:
                files: [
                    '<%= meta.src %>'
                ]
                tasks: ['coffeelint']
        copy:
            main:
                cwd: 'node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/'
                src: '**'
                dest: 'node_modules/omnisharp-server-roslyn-binaries/'
                mode: true
                expand: true
        clean: ['node_modules/omnisharp-node-client/node_modules/omnisharp-server-roslyn-binaries/']

        coffeelint:
            app: [
              'app/*.coffee'
              'scripts/*.coffee'
            ]

    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-contrib-copy'
    grunt.loadNpmTasks 'grunt-contrib-clean'
    grunt.loadNpmTasks 'grunt-coffeelint'

    grunt.registerTask 'default', ['watch']

    grunt.registerTask 'build-models', [], buildModel


    return
